import "server-only";
import {
  formatFromHeader,
  getEmailConfig,
} from "@/lib/email/config";
import type {
  EmailChannel,
} from "@/lib/email/config";
import type {
  TransactionalEmail,
  TransactionalEmailEventType,
} from "@/lib/email/types";

type SendTransactionalEmailInput = TransactionalEmail & {
  channel?: EmailChannel;
  eventType: TransactionalEmailEventType;
  idempotencyKey: string;
  to: string;
};

type SendTransactionalEmailResult =
  | { ok: true; providerMessageId: string }
  | { error: string; ok: false; retryable: boolean };

const MAX_RESPONSE_PREVIEW_LENGTH = 2048;
const MAX_STORED_ERROR_LENGTH = 240;
const RESEND_EMAILS_URL = "https://api.resend.com/emails";

function sanitizeErrorMessage(message: string) {
  return message
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/[\r\n]+/g, " ")
    .slice(0, MAX_STORED_ERROR_LENGTH);
}

function sanitizeProviderError(error: unknown) {
  if (error instanceof Error) {
    if (error.name === "AbortError" || error.name === "TimeoutError") {
      return "email_provider_timeout";
    }

    return sanitizeErrorMessage(error.message);
  }

  return "email_provider_error";
}

function isValidEmail(value: string) {
  if (value.length > 254 || /[\r\n]/.test(value)) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeEmail(value: string | undefined, errorCode: string) {
  const email = value?.trim().toLowerCase();

  if (!email || !isValidEmail(email)) {
    throw new Error(errorCode);
  }

  return email;
}

function normalizeIdempotencyKey(value: string) {
  const normalizedValue = value.trim();

  if (
    !normalizedValue ||
    normalizedValue.length > 256 ||
    /[\r\n]/.test(normalizedValue)
  ) {
    throw new Error("invalid_email_idempotency_key");
  }

  return normalizedValue;
}

function getRetryableStatus(status: number) {
  return status === 408 || status === 429 || status >= 500;
}

function validateEmailContent({
  html,
  subject,
  text,
}: TransactionalEmail) {
  if (!subject.trim() || /[\r\n]/.test(subject) || subject.length > 200) {
    throw new Error("invalid_email_subject");
  }

  if (!html.trim() || !text.trim()) {
    throw new Error("invalid_email_content");
  }
}

async function readResponsePreview(response: Response) {
  if (!response.body) {
    return "";
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = "";

  try {
    while (result.length < MAX_RESPONSE_PREVIEW_LENGTH) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      result += decoder.decode(value, { stream: true });
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }

  return result.slice(0, MAX_RESPONSE_PREVIEW_LENGTH);
}

function parseResendSuccessResponse(body: string) {
  let parsedBody: unknown;

  try {
    parsedBody = JSON.parse(body);
  } catch {
    return {
      error: "invalid_email_provider_response",
      ok: false as const,
    };
  }

  if (
    typeof parsedBody !== "object" ||
    parsedBody === null ||
    Array.isArray(parsedBody)
  ) {
    return {
      error: "invalid_email_provider_response",
      ok: false as const,
    };
  }

  const providerMessageId = (parsedBody as { id?: unknown }).id;

  if (
    typeof providerMessageId !== "string" ||
    providerMessageId.trim().length === 0 ||
    providerMessageId.length > 200
  ) {
    return {
      error: "invalid_email_provider_response",
      ok: false as const,
    };
  }

  return {
    ok: true as const,
    providerMessageId,
  };
}

function getProviderError(status: number, body: string) {
  const sanitizedBody = sanitizeErrorMessage(body);

  if (!sanitizedBody) {
    return `email_provider_${status}`;
  }

  return `email_provider_${status}: ${sanitizedBody}`;
}

function createTimeoutSignal(timeoutMs: number) {
  if (typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(timeoutMs);
  }

  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);

  return controller.signal;
}

export async function sendTransactionalEmail({
  channel = "orders",
  eventType,
  html,
  idempotencyKey,
  subject,
  text,
  to,
}: SendTransactionalEmailInput): Promise<SendTransactionalEmailResult> {
  let config: ReturnType<typeof getEmailConfig>;
  let normalizedIdempotencyKey: string;
  let recipientEmail: string;

  try {
    config = getEmailConfig(channel);
    normalizedIdempotencyKey = normalizeIdempotencyKey(idempotencyKey);
    recipientEmail = normalizeEmail(to, "invalid_recipient_email");
    validateEmailContent({ html, subject, text });
  } catch (error) {
    return {
      error: sanitizeProviderError(error),
      ok: false,
      retryable: false,
    };
  }

  try {
    const response = await fetch(RESEND_EMAILS_URL, {
      body: JSON.stringify({
        from: formatFromHeader(config),
        html,
        reply_to: config.replyTo ?? undefined,
        subject,
        tags: [
          {
            name: "event",
            value: eventType,
          },
        ],
        text,
        to: [recipientEmail],
      }),
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": normalizedIdempotencyKey,
      },
      method: "POST",
      signal: createTimeoutSignal(config.timeoutMs),
    });
    const responseBody = await readResponsePreview(response);

    if (!response.ok) {
      return {
        error: getProviderError(response.status, responseBody),
        ok: false,
        retryable: getRetryableStatus(response.status),
      };
    }

    const parsedResponse = parseResendSuccessResponse(responseBody);

    if (!parsedResponse.ok) {
      return {
        error: parsedResponse.error,
        ok: false,
        retryable: false,
      };
    }

    return {
      ok: true,
      providerMessageId: parsedResponse.providerMessageId,
    };
  } catch (error) {
    return {
      error: sanitizeProviderError(error),
      ok: false,
      retryable: true,
    };
  }
}
