import { after, NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType, User } from "@supabase/supabase-js";
import { getSafeAuthRedirect } from "@/lib/auth/redirects";
import {
  ensureAuthWelcomeEmailQueued,
  processAuthEmailOutboxBatch,
  processAuthEmailOutboxMutationBatch,
} from "@/lib/email/auth-email-processor";
import { createClient } from "@/lib/supabase/server";

type CallbackExchangeResult = {
  hasSession: boolean;
  method: "code" | "token_hash";
  user: User | null;
};

const callbackSuccessDestination = "/mi-cuenta";

function logAuthCallback(
  message: string,
  metadata: Record<string, string | number | boolean | null | undefined> = {},
) {
  console.info("[auth-callback]", message, metadata);
}

function logAuthCallbackError(message: string, error: unknown) {
  const sanitizedError =
    error instanceof Error
      ? error.message.replace(/[\r\n]+/g, " ").slice(0, 180)
      : "auth_callback_error";

  console.error("[auth-callback]", message, { error: sanitizedError });
}

function waitForProcessorRetry(delayMs: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

function getEmailOtpType(value: string | null): EmailOtpType | null {
  if (
    value === "email" ||
    value === "email_change" ||
    value === "invite" ||
    value === "magiclink" ||
    value === "recovery" ||
    value === "signup"
  ) {
    return value;
  }

  return null;
}

function getCallbackErrorCode(error: unknown) {
  if (!(error instanceof Error)) {
    return "callback";
  }

  const normalizedMessage = error.message.toLowerCase();

  if (normalizedMessage.includes("expired")) {
    return "auth-link-expired";
  }

  if (
    normalizedMessage.includes("already") ||
    normalizedMessage.includes("used")
  ) {
    return "auth-link-used";
  }

  if (
    normalizedMessage.includes("invalid") ||
    normalizedMessage.includes("token")
  ) {
    return "auth-link-invalid";
  }

  return "callback";
}

function getUserMetadataText(
  metadata: User["user_metadata"],
  key: "first_name" | "full_name",
) {
  const value = metadata[key];

  return typeof value === "string" ? value : null;
}

async function processAuthEmailOutboxAfterCallback(source: string) {
  logAuthCallback("auth_outbox_processing_started", {
    phase: "inline",
    source,
  });

  try {
    const result = await processAuthEmailOutboxMutationBatch(
      `${source}:inline`,
    );
    logAuthCallback("auth_outbox_processing_finished", {
      phase: "inline",
      processed: result.processed,
      source,
    });
  } catch (error) {
    logAuthCallbackError("auth_outbox_processing_failed", error);
  }

  after(async () => {
    logAuthCallback("auth_outbox_processing_started", {
      phase: "after",
      source,
    });

    try {
      await waitForProcessorRetry(450);
      const firstResult = await processAuthEmailOutboxMutationBatch(
        `${source}:after-fast`,
      );

      if (firstResult.processed === 0) {
        await waitForProcessorRetry(1200);
        await processAuthEmailOutboxBatch(`${source}:after`);
      }

      logAuthCallback("auth_outbox_processing_finished", {
        phase: "after",
        processed: firstResult.processed,
        source,
      });
    } catch (error) {
      logAuthCallbackError("auth_outbox_processing_failed", error);
    }
  });
}

async function ensureWelcomeEmailForUser(user: User | null, source: string) {
  if (!user) {
    return;
  }

  try {
    await ensureAuthWelcomeEmailQueued({
      confirmedAt: user.email_confirmed_at,
      createdAt: user.created_at,
      email: user.email,
      firstName: getUserMetadataText(user.user_metadata, "first_name"),
      fullName: getUserMetadataText(user.user_metadata, "full_name"),
      source,
      userId: user.id,
    });
  } catch (error) {
    logAuthCallbackError("auth_outbox_queue_failed", error);
  }
}

async function getExchangeUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: User | null,
) {
  if (user) {
    return user;
  }

  const {
    data: { user: sessionUser },
  } = await supabase.auth.getUser();

  return sessionUser;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = getEmailOtpType(requestUrl.searchParams.get("type"));
  const nextPath = getSafeAuthRedirect(requestUrl.searchParams.get("next"));
  const isRecoveryFlow =
    type === "recovery" || nextPath === "/actualizar-contrasena";

  logAuthCallback("callback_received", {
    hasCode: Boolean(code),
    hasNext: requestUrl.searchParams.has("next"),
    hasTokenHash: Boolean(tokenHash),
    type: type ?? "none",
  });

  if (!code && (!tokenHash || !type)) {
    const redirectUrl = new URL(
      "/ingresar?error=auth-link-invalid",
      request.url,
    );
    logAuthCallback("redirect_selected", {
      destination: redirectUrl.pathname,
      reason: "missing_callback_credentials",
    });

    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createClient();
  let exchangeResult: CallbackExchangeResult;

  try {
    if (code) {
      logAuthCallback("exchange_started", { method: "code" });
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        throw error;
      }

      exchangeResult = {
        hasSession: Boolean(data.session),
        method: "code",
        user: await getExchangeUser(supabase, data.user),
      };
    } else {
      logAuthCallback("exchange_started", { method: "token_hash" });
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash ?? "",
        type: type ?? "email",
      });

      if (error) {
        throw error;
      }

      exchangeResult = {
        hasSession: Boolean(data.session),
        method: "token_hash",
        user: await getExchangeUser(supabase, data.user),
      };
    }

    logAuthCallback("exchange_success", {
      hasSession: exchangeResult.hasSession,
      hasUser: Boolean(exchangeResult.user),
      method: exchangeResult.method,
    });
  } catch (error) {
    const errorCode = getCallbackErrorCode(error);
    const redirectUrl = new URL(`/ingresar?error=${errorCode}`, request.url);

    logAuthCallback("exchange_failed", {
      errorCode,
      method: code ? "code" : "token_hash",
    });
    logAuthCallback("redirect_selected", {
      destination: redirectUrl.pathname,
      reason: errorCode,
    });

    return NextResponse.redirect(redirectUrl);
  }

  if (!isRecoveryFlow) {
    await ensureWelcomeEmailForUser(exchangeResult.user, "auth-callback");
    await processAuthEmailOutboxAfterCallback("auth-callback");
  }

  if (isRecoveryFlow) {
    const redirectUrl = new URL(nextPath, request.url);
    logAuthCallback("redirect_selected", {
      destination: redirectUrl.pathname,
      reason: "recovery_flow",
    });

    return NextResponse.redirect(redirectUrl);
  }

  if (exchangeResult.hasSession) {
    const redirectUrl = new URL(callbackSuccessDestination, request.url);
    redirectUrl.searchParams.set("email-confirmado", "1");
    logAuthCallback("redirect_selected", {
      destination: redirectUrl.pathname,
      reason: "email_confirmed_with_session",
    });

    return NextResponse.redirect(redirectUrl);
  }

  const redirectUrl = new URL("/ingresar", request.url);
  redirectUrl.searchParams.set("email-confirmado", "1");
  redirectUrl.searchParams.set("next", callbackSuccessDestination);
  logAuthCallback("redirect_selected", {
    destination: redirectUrl.pathname,
    reason: "email_confirmed_without_session",
  });

  return NextResponse.redirect(redirectUrl);
}
