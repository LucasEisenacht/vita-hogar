import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "@/lib/email/send-transactional-email";
import { renderUserWelcomeEmail } from "@/lib/email/templates/user-welcome";
import type {
  AuthEmailEventType,
  AuthEmailStatus,
  AuthWelcomeEmailPayload,
} from "@/lib/email/types";
import type { Json } from "@/types/database";

export const AUTH_EMAIL_OUTBOX_BATCH_SIZE = 10;
export const AUTH_EMAIL_OUTBOX_MUTATION_BATCH_SIZE = 3;

type AuthWelcomeQueueInput = {
  confirmedAt?: string | null;
  createdAt?: string | null;
  email?: string | null;
  firstName?: string | null;
  fullName?: string | null;
  source?: string;
  userId?: string | null;
};

type ClaimedAuthEmailRow = {
  attempts: number;
  event_type: AuthEmailEventType;
  id: string;
  next_attempt_at: string | null;
  payload: Json;
  provider_message_id: string | null;
  recipient_email: string;
  user_id: string;
};

class AuthEmailSendError extends Error {
  retryable: boolean;

  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = "AuthEmailSendError";
    this.retryable = retryable;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function normalizeOptionalString(value?: string | null) {
  const trimmedValue = value?.trim();

  return trimmedValue ? trimmedValue : undefined;
}

function normalizeRequiredString(value?: string | null) {
  const trimmedValue = value?.trim();

  return trimmedValue ? trimmedValue : null;
}

function parseAuthWelcomePayload(
  payload: unknown,
): AuthWelcomeEmailPayload | null {
  if (!isRecord(payload)) {
    return null;
  }

  const eventType = getString(payload.eventType);
  const userId = getString(payload.userId);
  const email = getString(payload.email);
  const createdAt = getString(payload.createdAt);
  const confirmedAt = getString(payload.confirmedAt);

  if (
    eventType !== "user_welcome" ||
    !userId ||
    !email ||
    !createdAt ||
    !confirmedAt
  ) {
    return null;
  }

  return {
    confirmedAt,
    createdAt,
    email,
    eventType,
    firstName: getString(payload.firstName),
    fullName: getString(payload.fullName),
    userId,
  };
}

function sanitizeLastError(error: string) {
  return error.replace(/[\r\n]+/g, " ").slice(0, 240);
}

function logAuthEmail(
  message: string,
  metadata: Record<string, string | number | boolean | null | undefined> = {},
) {
  console.info("[auth-email-outbox]", message, metadata);
}

export async function ensureAuthWelcomeEmailQueued({
  confirmedAt,
  createdAt,
  email,
  firstName,
  fullName,
  source = "unknown",
  userId,
}: AuthWelcomeQueueInput) {
  const normalizedUserId = normalizeRequiredString(userId);
  const normalizedEmail = normalizeRequiredString(email)?.toLowerCase() ?? null;
  const normalizedCreatedAt = normalizeRequiredString(createdAt);
  const normalizedConfirmedAt = normalizeRequiredString(confirmedAt);

  if (
    !normalizedUserId ||
    !normalizedEmail ||
    !normalizedCreatedAt ||
    !normalizedConfirmedAt
  ) {
    logAuthEmail("queue_skipped", {
      hasConfirmedAt: Boolean(normalizedConfirmedAt),
      hasCreatedAt: Boolean(normalizedCreatedAt),
      hasEmail: Boolean(normalizedEmail),
      hasUserId: Boolean(normalizedUserId),
      source,
    });

    return { queued: false };
  }

  const payload: AuthWelcomeEmailPayload = {
    confirmedAt: normalizedConfirmedAt,
    createdAt: normalizedCreatedAt,
    email: normalizedEmail,
    eventType: "user_welcome",
    firstName: normalizeOptionalString(firstName),
    fullName: normalizeOptionalString(fullName),
    userId: normalizedUserId,
  };
  const supabase = createAdminClient();
  const { error } = await supabase.from("auth_email_outbox").upsert(
    {
      event_type: "user_welcome",
      payload,
      recipient_email: normalizedEmail,
      status: "pending",
      user_id: normalizedUserId,
    },
    {
      ignoreDuplicates: true,
      onConflict: "user_id,event_type",
    },
  );

  if (error) {
    logAuthEmail("queue_failed", {
      code: error.code,
      source,
      userId: normalizedUserId,
    });
    throw new Error("auth_email_outbox_queue_failed");
  }

  logAuthEmail("queue_finished", {
    eventType: "user_welcome",
    source,
    userId: normalizedUserId,
  });

  return { queued: true };
}

function getNextAttemptAt(attempts: number, retryable: boolean) {
  if (!retryable || attempts >= 5) {
    return null;
  }

  const delayMinutesByAttempt: Record<number, number> = {
    1: 1,
    2: 5,
    3: 15,
    4: 60,
  };
  const delayMinutes = delayMinutesByAttempt[attempts];

  if (!delayMinutes) {
    return null;
  }

  return new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();
}

function isRetryableAuthEmailError(lastError: string) {
  return ![
    "auth_email_from_not_configured",
    "email_provider_not_configured",
    "invalid_email_content",
    "invalid_email_idempotency_key",
    "invalid_email_provider_response",
    "invalid_email_provider_timeout",
    "invalid_email_subject",
    "invalid_from_email",
    "invalid_from_name",
    "invalid_recipient_email",
    "invalid_reply_to_email",
  ].includes(lastError);
}

export async function processAuthEmailOutbox(
  batchSize = AUTH_EMAIL_OUTBOX_BATCH_SIZE,
  source = "manual",
) {
  logAuthEmail("batch_started", { batchSize, source });
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("claim_auth_email_outbox", {
    batch_size: batchSize,
  });

  if (error) {
    logAuthEmail("claim_failed", {
      code: error.code,
      source,
    });
    throw new Error("auth_email_outbox_claim_failed");
  }

  const rows = (data ?? []) as ClaimedAuthEmailRow[];
  const results: Array<{ id: string; status: AuthEmailStatus }> = [];

  logAuthEmail("batch_claimed", {
    claimed: rows.length,
    source,
  });

  for (const row of rows) {
    const payload = parseAuthWelcomePayload(row.payload);

    try {
      if (!payload) {
        throw new Error("invalid_auth_email_payload");
      }

      const email = renderUserWelcomeEmail(payload);
      const sendResult = await sendTransactionalEmail({
        ...email,
        channel: "auth",
        eventType: payload.eventType,
        idempotencyKey: row.id,
        to: row.recipient_email,
      });

      if (!sendResult.ok) {
        throw new AuthEmailSendError(sendResult.error, sendResult.retryable);
      }

      await supabase
        .from("auth_email_outbox")
        .update({
          last_error: null,
          next_attempt_at: null,
          provider_message_id: sendResult.providerMessageId,
          sent_at: new Date().toISOString(),
          status: "sent",
        })
        .eq("id", row.id)
        .eq("status", "processing");
      results.push({ id: row.id, status: "sent" });
      logAuthEmail("row_finalized", {
        eventType: row.event_type,
        outboxId: row.id,
        source,
        status: "sent",
        userId: row.user_id,
      });
    } catch (error) {
      const lastError = sanitizeLastError(
        error instanceof Error ? error.message : "auth_email_send_failed",
      );
      const retryable =
        error instanceof AuthEmailSendError
          ? error.retryable
          : isRetryableAuthEmailError(lastError);
      const nextAttemptAt = getNextAttemptAt(row.attempts, retryable);

      await supabase
        .from("auth_email_outbox")
        .update({
          attempts: retryable ? row.attempts : 5,
          last_error: lastError,
          next_attempt_at: nextAttemptAt,
          status: "failed",
        })
        .eq("id", row.id)
        .eq("status", "processing");
      results.push({ id: row.id, status: "failed" });
      logAuthEmail("row_finalized", {
        error: lastError,
        eventType: row.event_type,
        outboxId: row.id,
        source,
        status: "failed",
        userId: row.user_id,
      });
    }
  }

  logAuthEmail("batch_finished", {
    processed: results.length,
    source,
  });

  return {
    processed: results.length,
    results,
  };
}

export async function processAuthEmailOutboxBatch(source = "manual") {
  return processAuthEmailOutbox(AUTH_EMAIL_OUTBOX_BATCH_SIZE, source);
}

export async function processAuthEmailOutboxMutationBatch(
  source = "mutation",
) {
  return processAuthEmailOutbox(AUTH_EMAIL_OUTBOX_MUTATION_BATCH_SIZE, source);
}
