import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { processOrderEmailOutboxBatch } from "@/lib/email/order-email-processor";
import {
  checkRateLimit,
  getRateLimitHeaders,
  getRequestIdentifier,
} from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const cronSecretEnvNames = ["CRON_SECRET", "ORDER_EMAIL_PROCESSOR_SECRET"] as const;
const manualSecretEnvNames = ["ORDER_EMAIL_PROCESSOR_SECRET"] as const;

function hashSecret(value: string) {
  return createHash("sha256").update(value).digest();
}

function timingSafeStringEqual(left: string, right: string) {
  const leftHash = hashSecret(left);
  const rightHash = hashSecret(right);

  return timingSafeEqual(leftHash, rightHash) && left.length === right.length;
}

function getAllowedProcessorSecrets(secretEnvNames: readonly string[]) {
  return secretEnvNames
    .map((name) => process.env[name]?.trim())
    .filter((secret): secret is string => Boolean(secret));
}

function isAuthorized(
  request: NextRequest,
  secretEnvNames: readonly string[],
) {
  const secrets = getAllowedProcessorSecrets(secretEnvNames);
  const authorization = request.headers.get("authorization");

  if (secrets.length === 0 || !authorization?.startsWith("Bearer ")) {
    return false;
  }

  const providedSecret = authorization.slice("Bearer ".length);

  return secrets.some((secret) => timingSafeStringEqual(providedSecret, secret));
}

function sanitizeEndpointError(error: unknown) {
  if (error instanceof Error) {
    return error.message.replace(/[\r\n]+/g, " ").slice(0, 160);
  }

  return "email_processor_failed";
}

async function checkEndpointRateLimit(request: NextRequest) {
  try {
    const result = await checkRateLimit(
      {
        keyPrefix: "order-email-processor",
        limit: 30,
        windowSeconds: 60,
      },
      getRequestIdentifier(request),
    );

    return result;
  } catch (error) {
    console.error("[processOrderEmailOutbox:rate-limit]", sanitizeEndpointError(error));

    return null;
  }
}

async function handleProcessOrderOutbox(
  request: NextRequest,
  secretEnvNames: readonly string[],
) {
  if (!isAuthorized(request, secretEnvNames)) {
    return NextResponse.json(
      {
        error: "unauthorized",
        ok: false,
        requiredSecret: process.env.NODE_ENV === "development"
          ? secretEnvNames.join(" or ")
          : undefined,
      },
      {
        status: 401,
      },
    );
  }

  const rateLimit = await checkEndpointRateLimit(request);

  if (rateLimit?.status === "limited") {
    return NextResponse.json(
      {
        error: "rate_limited",
        ok: false,
      },
      {
        headers: getRateLimitHeaders(rateLimit),
        status: 429,
      },
    );
  }

  try {
    const result = await processOrderEmailOutboxBatch();

    return NextResponse.json(
      {
        ok: true,
        ...result,
      },
    );
  } catch (error) {
    console.error("[processOrderEmailOutbox]", sanitizeEndpointError(error));

    return NextResponse.json(
      {
        error: "email_processor_failed",
        ok: false,
      },
      {
        status: 500,
      },
    );
  }
}

export async function GET(request: NextRequest) {
  return handleProcessOrderOutbox(request, cronSecretEnvNames);
}

export async function POST(request: NextRequest) {
  return handleProcessOrderOutbox(request, manualSecretEnvNames);
}
