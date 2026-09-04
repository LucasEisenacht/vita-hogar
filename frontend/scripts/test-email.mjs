const RESEND_EMAILS_URL = "https://api.resend.com/emails";

function getArgumentValue(name) {
  const prefix = `${name}=`;
  const directIndex = process.argv.indexOf(name);

  if (directIndex >= 0) {
    return process.argv[directIndex + 1];
  }

  return process.argv
    .find((argument) => argument.startsWith(prefix))
    ?.slice(prefix.length);
}

function isValidEmail(value) {
  return (
    typeof value === "string" &&
    value.length <= 254 &&
    !/[\r\n]/.test(value) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}

function sanitizeHeaderText(value) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function requireEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}.`);
  }

  return value;
}

async function main() {
  const to = getArgumentValue("--to");

  if (!isValidEmail(to)) {
    throw new Error("Uso: npm run email:test -- --to correo@ejemplo.com");
  }

  const apiKey = requireEnv("RESEND_API_KEY");
  const from = sanitizeHeaderText(requireEnv("EMAIL_FROM"));
  const siteUrl = sanitizeHeaderText(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  );
  const replyTo = process.env.EMAIL_REPLY_TO?.trim() || undefined;
  const subject = "Prueba de email W.todocell";
  const html = `
    <!doctype html>
    <html lang="es">
      <body style="margin:0;background:#fff8f6;color:#3b2d32;font-family:Arial,sans-serif;">
        <div style="max-width:560px;margin:0 auto;padding:28px 16px;">
          <div style="border:1px solid #f1dfe5;border-radius:24px;background:#fffdfb;padding:28px;">
            <p style="margin:0 0 12px;color:#b9788e;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">W.todocell</p>
            <h1 style="margin:0 0 12px;font-size:26px;line-height:1.2;">Email de prueba</h1>
            <p style="margin:0;color:#6f5660;line-height:1.7;">
              Este mensaje confirma que la configuracion de Resend y remitente funciona correctamente.
            </p>
            <p style="margin:18px 0 0;color:#8f6976;font-size:13px;">Origen configurado: ${siteUrl}</p>
          </div>
        </div>
      </body>
    </html>
  `;
  const text = [
    "W.todocell - Email de prueba",
    "Este mensaje confirma que la configuracion de Resend y remitente funciona correctamente.",
    `Origen configurado: ${siteUrl}`,
  ].join("\n\n");

  const response = await fetch(RESEND_EMAILS_URL, {
    body: JSON.stringify({
      from,
      html,
      reply_to: replyTo,
      subject,
      text,
      to: [to.trim().toLowerCase()],
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `wtodocell-email-test-${Date.now()}`,
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Resend rejected the test email with status ${response.status}.`);
  }

  console.log("Email de prueba enviado correctamente.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Email test failed.");
  process.exitCode = 1;
});
