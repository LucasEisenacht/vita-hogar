import "server-only";
import { headers } from "next/headers";
import {
  checkRateLimit,
  getRequestIdentifierFromHeaders,
  hashIdentifier,
} from "@/lib/security/rate-limit";

type SensitiveActionRateLimitInput = {
  identity?: string | null;
  keyPrefix: string;
  limit: number;
  windowSeconds: number;
};

type SensitiveActionRateLimitResult = {
  allowed: boolean;
  requestIpHash: string;
  source: "development-memory" | "disabled" | "provider_error" | "upstash";
};

function sanitizeRateLimitError(error: unknown) {
  return error instanceof Error
    ? error.message.replace(/[\r\n]+/g, " ").slice(0, 120)
    : "rate_limit_error";
}

export async function checkSensitiveActionRateLimit({
  identity,
  keyPrefix,
  limit,
  windowSeconds,
}: SensitiveActionRateLimitInput): Promise<SensitiveActionRateLimitResult> {
  const headersList = await headers();
  const requestIdentifier = getRequestIdentifierFromHeaders(headersList);
  const requestIpHash = hashIdentifier(requestIdentifier);
  const rateLimitIdentifier = [identity, requestIpHash]
    .filter(Boolean)
    .join(":");

  try {
    const result = await checkRateLimit(
      {
        keyPrefix,
        limit,
        windowSeconds,
      },
      rateLimitIdentifier || "unknown",
    );

    return {
      allowed: result.status !== "limited",
      requestIpHash,
      source: result.source,
    };
  } catch (error) {
    console.error("[rate-limit]", sanitizeRateLimitError(error));

    return {
      allowed: true,
      requestIpHash,
      source: "provider_error",
    };
  }
}
