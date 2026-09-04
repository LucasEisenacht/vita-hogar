import "server-only";
import { createHash } from "node:crypto";

type RateLimitPolicy = {
  critical?: boolean;
  keyPrefix: string;
  limit: number;
  windowSeconds: number;
};

type RateLimitResult = {
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter: number;
  source: "development-memory" | "disabled" | "upstash";
  status: "allowed" | "limited" | "unconfigured";
};

type UpstashCommandResult = {
  result?: unknown;
};

const developmentCounters = new Map<
  string,
  {
    count: number;
    resetAt: number;
  }
>();

function getUpstashConfig() {
  const restUrl = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/+$/, "");
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!restUrl || !restToken) {
    return null;
  }

  return {
    restToken,
    restUrl,
  };
}

export function hashIdentifier(identifier: string) {
  return createHash("sha256").update(identifier).digest("hex").slice(0, 32);
}

function getRateLimitKey(policy: RateLimitPolicy, identifier: string) {
  return `wtodocell:${policy.keyPrefix}:${hashIdentifier(identifier)}`;
}

function getRetryAfter(resetAt: number) {
  return Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
}

function checkDevelopmentRateLimit(
  policy: RateLimitPolicy,
  identifier: string,
): RateLimitResult {
  const key = getRateLimitKey(policy, identifier);
  const now = Date.now();
  const existingCounter = developmentCounters.get(key);
  const counter =
    existingCounter && existingCounter.resetAt > now
      ? existingCounter
      : {
          count: 0,
          resetAt: now + policy.windowSeconds * 1000,
        };

  counter.count += 1;
  developmentCounters.set(key, counter);

  const remaining = Math.max(policy.limit - counter.count, 0);
  const status = counter.count > policy.limit ? "limited" : "allowed";

  return {
    limit: policy.limit,
    remaining,
    resetAt: counter.resetAt,
    retryAfter: getRetryAfter(counter.resetAt),
    source: "development-memory",
    status,
  };
}

function parseUpstashCount(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
}

async function checkUpstashRateLimit(
  policy: RateLimitPolicy,
  identifier: string,
): Promise<RateLimitResult> {
  const config = getUpstashConfig();

  if (!config) {
    throw new Error("rate_limit_provider_unconfigured");
  }

  const key = getRateLimitKey(policy, identifier);
  const resetAt = Date.now() + policy.windowSeconds * 1000;
  const response = await fetch(`${config.restUrl}/pipeline`, {
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, String(policy.windowSeconds)],
    ]),
    headers: {
      Authorization: `Bearer ${config.restToken}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("rate_limit_provider_error");
  }

  const payload: unknown = await response.json();
  const results = Array.isArray(payload) ? (payload as Array<UpstashCommandResult>) : [];
  const count = parseUpstashCount(results[0]?.result);

  if (count === null) {
    throw new Error("rate_limit_provider_response_invalid");
  }

  return {
    limit: policy.limit,
    remaining: Math.max(policy.limit - count, 0),
    resetAt,
    retryAfter: getRetryAfter(resetAt),
    source: "upstash",
    status: count > policy.limit ? "limited" : "allowed",
  };
}

export async function checkRateLimit(
  policy: RateLimitPolicy,
  identifier: string,
): Promise<RateLimitResult> {
  if (policy.limit <= 0 || policy.windowSeconds <= 0) {
    throw new Error("invalid_rate_limit_policy");
  }

  if (getUpstashConfig()) {
    return checkUpstashRateLimit(policy, identifier);
  }

  if (process.env.NODE_ENV === "development") {
    return checkDevelopmentRateLimit(policy, identifier);
  }

  if (policy.critical) {
    return {
      limit: policy.limit,
      remaining: 0,
      resetAt: Date.now() + policy.windowSeconds * 1000,
      retryAfter: policy.windowSeconds,
      source: "disabled",
      status: "unconfigured",
    };
  }

  return {
    limit: policy.limit,
    remaining: policy.limit,
    resetAt: Date.now() + policy.windowSeconds * 1000,
    retryAfter: 0,
    source: "disabled",
    status: "allowed",
  };
}

export function getRateLimitHeaders(result: RateLimitResult): HeadersInit {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    "X-RateLimit-Source": result.source,
  };

  if (result.status === "limited" || result.status === "unconfigured") {
    headers["Retry-After"] = String(result.retryAfter);
  }

  return headers;
}

export function getRequestIdentifier(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const forwardedIp = forwardedFor?.split(",")[0]?.trim();

  return forwardedIp || realIp || "unknown";
}

export function getRequestIdentifierFromHeaders(
  headersList: Pick<Headers, "get">,
) {
  const forwardedFor = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  const forwardedIp = forwardedFor?.split(",")[0]?.trim();

  return forwardedIp || realIp || "unknown";
}
