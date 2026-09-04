import "server-only";

type EmailConfig = {
  apiKey: string;
  fromAddress: string;
  fromName: string;
  replyTo: string | null;
  timeoutMs: number;
};

export type EmailChannel = "auth" | "orders";

const DEFAULT_TIMEOUT_MS = 10000;
const PUBLIC_SENDER_DOMAINS = new Set([
  "gmail.com",
  "hotmail.com",
  "icloud.com",
  "live.com",
  "outlook.com",
  "yahoo.com",
]);

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

function parseTimeoutMs(value: string | undefined) {
  if (!value) {
    return DEFAULT_TIMEOUT_MS;
  }

  const parsedValue = Number(value);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < 1000 ||
    parsedValue > 30000
  ) {
    throw new Error("invalid_email_provider_timeout");
  }

  return parsedValue;
}

function normalizeHeaderText(value: string | undefined, errorCode: string) {
  const normalizedValue = value?.replace(/[\r\n]+/g, " ").trim();

  if (!normalizedValue) {
    throw new Error(errorCode);
  }

  return normalizedValue.slice(0, 120);
}

function parseEmailFrom(value: string | undefined, missingErrorCode: string) {
  const normalizedValue = value?.replace(/[\r\n]+/g, " ").trim();

  if (!normalizedValue) {
    throw new Error(missingErrorCode);
  }

  const namedAddressMatch = normalizedValue.match(/^(.+?)\s*<([^<>]+)>$/);

  if (namedAddressMatch) {
    return {
      fromAddress: normalizeEmail(namedAddressMatch[2], "invalid_from_email"),
      fromName: normalizeHeaderText(namedAddressMatch[1], "invalid_from_name"),
    };
  }

  return {
    fromAddress: normalizeEmail(normalizedValue, "invalid_from_email"),
    fromName: "W.todocell",
  };
}

function assertProductionSenderDomain(email: string) {
  const domain = email.split("@")[1];

  if (
    process.env.VERCEL_ENV === "production" &&
    PUBLIC_SENDER_DOMAINS.has(domain)
  ) {
    throw new Error("invalid_from_email");
  }
}

function getFromEnvName(channel: EmailChannel) {
  return channel === "auth" ? "AUTH_EMAIL_FROM" : "EMAIL_FROM";
}

function getReplyToValue(channel: EmailChannel) {
  if (channel === "auth") {
    return process.env.AUTH_EMAIL_REPLY_TO?.trim() || process.env.EMAIL_REPLY_TO;
  }

  return process.env.EMAIL_REPLY_TO;
}

export function getEmailConfig(channel: EmailChannel = "orders"): EmailConfig {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("email_provider_not_configured");
  }

  const fromEnvName = getFromEnvName(channel);
  const parsedFrom = parseEmailFrom(
    process.env[fromEnvName],
    channel === "auth" ? "auth_email_from_not_configured" : "invalid_from_email",
  );

  assertProductionSenderDomain(parsedFrom.fromAddress);

  const replyToValue = getReplyToValue(channel);
  const replyTo = replyToValue?.trim()
    ? normalizeEmail(replyToValue, "invalid_reply_to_email")
    : null;

  return {
    apiKey,
    fromAddress: parsedFrom.fromAddress,
    fromName: parsedFrom.fromName,
    replyTo,
    timeoutMs: parseTimeoutMs(process.env.EMAIL_PROVIDER_TIMEOUT_MS),
  };
}

export function formatFromHeader(config: Pick<EmailConfig, "fromAddress" | "fromName">) {
  return `${config.fromName} <${config.fromAddress}>`;
}
