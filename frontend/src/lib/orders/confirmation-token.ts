import "server-only";
import { createHmac } from "node:crypto";

const SUPPORTED_SECRET_VERSIONS = [1, 2] as const;

export type OrderConfirmationTokenSecretVersion =
  (typeof SUPPORTED_SECRET_VERSIONS)[number];

const currentVersionEnvName = "ORDER_CONFIRMATION_TOKEN_SECRET_CURRENT_VERSION";
const secretEnvNames: Record<OrderConfirmationTokenSecretVersion, string> = {
  1: "ORDER_CONFIRMATION_TOKEN_SECRET_V1",
  2: "ORDER_CONFIRMATION_TOKEN_SECRET_V2",
};

function isSupportedSecretVersion(
  value: number,
): value is OrderConfirmationTokenSecretVersion {
  return SUPPORTED_SECRET_VERSIONS.some((version) => version === value);
}

function parseSecretVersion(value: string | undefined) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    if (process.env.VERCEL_ENV === "production") {
      throw new Error(`Missing required environment variable: ${currentVersionEnvName}.`);
    }

    return 1;
  }

  const version = Number(normalizedValue);

  if (!Number.isInteger(version) || !isSupportedSecretVersion(version)) {
    throw new Error(`Invalid ${currentVersionEnvName}.`);
  }

  return version;
}

export function getCurrentOrderConfirmationTokenSecretVersion() {
  return parseSecretVersion(
    process.env.ORDER_CONFIRMATION_TOKEN_SECRET_CURRENT_VERSION,
  );
}

function getConfirmationTokenSecret(
  secretVersion: OrderConfirmationTokenSecretVersion,
) {
  const secret = process.env[secretEnvNames[secretVersion]]?.trim();

  if (!secret || secret.length < 32 || /[\r\n]/.test(secret)) {
    throw new Error(
      `Invalid or missing order confirmation token secret for version ${secretVersion}.`,
    );
  }

  return secret;
}

export function validateOrderConfirmationTokenConfiguration() {
  const currentVersion = getCurrentOrderConfirmationTokenSecretVersion();

  getConfirmationTokenSecret(currentVersion);

  return {
    currentVersion,
    requiredSecretEnvName: secretEnvNames[currentVersion],
  };
}

export function createOrderConfirmationToken({
  idempotencyKey,
  secretVersion,
}: {
  idempotencyKey: string;
  secretVersion: number;
}) {
  if (!isSupportedSecretVersion(secretVersion)) {
    throw new Error("Unsupported order confirmation token secret version.");
  }

  return createHmac("sha256", getConfirmationTokenSecret(secretVersion))
    .update(idempotencyKey)
    .digest("hex");
}
