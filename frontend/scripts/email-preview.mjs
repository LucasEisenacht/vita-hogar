import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const Module = require("node:module");
const typescript = require("typescript");

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const supportedEvents = new Set([
  "order_received",
  "payment_confirmed",
  "order_shipped",
  "order_delivered",
]);

function getArgumentValue(name) {
  const directIndex = process.argv.indexOf(name);

  if (directIndex >= 0) {
    return process.argv[directIndex + 1];
  }

  const prefix = `${name}=`;

  return process.argv
    .find((argument) => argument.startsWith(prefix))
    ?.slice(prefix.length);
}

function installTypeScriptRuntime() {
  const serverOnlyStubPath = path.join(
    os.tmpdir(),
    "wtodocell-server-only-stub.cjs",
  );

  if (!fs.existsSync(serverOnlyStubPath)) {
    fs.writeFileSync(serverOnlyStubPath, "module.exports = {};\n", "utf8");
  }

  const originalResolveFilename = Module._resolveFilename;

  Module._resolveFilename = function resolveWtodocellRequest(
    request,
    parent,
    isMain,
    options,
  ) {
    if (request === "server-only") {
      return serverOnlyStubPath;
    }

    if (request.startsWith("@/")) {
      return originalResolveFilename.call(
        this,
        path.join(projectRoot, "src", request.slice(2)),
        parent,
        isMain,
        options,
      );
    }

    return originalResolveFilename.call(this, request, parent, isMain, options);
  };

  require.extensions[".ts"] = function compileTypeScript(module, filename) {
    const source = fs.readFileSync(filename, "utf8");
    const output = typescript.transpileModule(source, {
      compilerOptions: {
        esModuleInterop: true,
        jsx: typescript.JsxEmit.ReactJSX,
        module: typescript.ModuleKind.CommonJS,
        moduleResolution: typescript.ModuleResolutionKind.Node10,
        target: typescript.ScriptTarget.ES2020,
      },
      fileName: filename,
    });

    module._compile(output.outputText, filename);
  };
}

function getFixturePayload(eventType) {
  const createdAt = "2026-07-26T18:12:00.000Z";
  const paidAt = "2026-07-26T18:45:00.000Z";
  const shippedAt = "2026-07-27T16:20:00.000Z";
  const deliveredAt = "2026-07-28T20:10:00.000Z";

  return {
    buyerType: "guest",
    confirmationUrl:
      "https://www.wtodocell.com.ar/checkout/confirmacion/WT-2026-000005?token=preview-token",
    createdAt,
    currency: "ARS",
    customerEmail: "lucas.preview@example.com",
    customerFirstName: "Lucas",
    customerLastName: "2",
    deliveredAt: eventType === "order_delivered" ? deliveredAt : undefined,
    deliveryMethod: "amba_courier",
    discountAmount: 1500,
    eventType,
    items: [
      {
        lineTotal: 24000,
        productName: "Funda Labubu",
        productSlug: "funda-labubu",
        quantity: 2,
        selectedColor: "Rosa",
        selectedCompatibility: "iPhone 15",
        unitPrice: 12000,
        variantBrand: "Apple",
        variantModel: "iPhone 15",
      },
      {
        lineTotal: 8500,
        productName: "Pop Socket pearl blush",
        productSlug: "pop-socket-pearl-blush",
        quantity: 1,
        selectedColor: "Champagne",
        unitPrice: 8500,
      },
    ],
    orderId: "00000000-0000-4000-8000-000000000005",
    orderNumber: "WT-2026-000005",
    paidAt:
      eventType === "payment_confirmed" ||
      eventType === "order_shipped" ||
      eventType === "order_delivered"
        ? paidAt
        : undefined,
    paymentMethod: "bank_transfer",
    paymentStatus:
      eventType === "order_received" ? "pending" : "approved",
    shippedAt:
      eventType === "order_shipped" || eventType === "order_delivered"
        ? shippedAt
        : undefined,
    shippingAddress: {
      city: "Monte Grande",
      floorApartment: "2B",
      number: "123",
      postalCode: "1842",
      province: "Buenos Aires",
      street: "Avenida Principal",
    },
    shippingCost: 5000,
    shippingCostStatus: "fixed",
    status:
      eventType === "order_delivered"
        ? "delivered"
        : eventType === "order_shipped"
          ? "shipped"
          : eventType === "payment_confirmed"
            ? "payment_confirmed"
            : "pending_payment",
    subtotal: 32500,
    total: 36000,
  };
}

function getTemplateRenderer(eventType) {
  if (eventType === "order_received") {
    return require(path.join(
      projectRoot,
      "src/lib/email/templates/order-received.ts",
    )).renderOrderReceivedEmail;
  }

  if (eventType === "payment_confirmed") {
    return require(path.join(
      projectRoot,
      "src/lib/email/templates/payment-confirmed.ts",
    )).renderPaymentConfirmedEmail;
  }

  if (eventType === "order_shipped") {
    return require(path.join(
      projectRoot,
      "src/lib/email/templates/order-shipped.ts",
    )).renderOrderShippedEmail;
  }

  return require(path.join(
    projectRoot,
    "src/lib/email/templates/order-delivered.ts",
  )).renderOrderDeliveredEmail;
}

function main() {
  const eventType = getArgumentValue("--event") ?? "order_received";

  if (!supportedEvents.has(eventType)) {
    throw new Error(
      `Evento no soportado. Usa uno de: ${Array.from(supportedEvents).join(", ")}`,
    );
  }

  installTypeScriptRuntime();

  const renderEmail = getTemplateRenderer(eventType);
  const email = renderEmail(getFixturePayload(eventType));
  const outputDir = path.join(projectRoot, "email-previews");

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, `${eventType}.html`), email.html, "utf8");
  fs.writeFileSync(path.join(outputDir, `${eventType}.txt`), email.text, "utf8");

  console.log(`Preview generado: email-previews/${eventType}.html`);
  console.log(`Texto plano: email-previews/${eventType}.txt`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : "Email preview failed.");
  process.exitCode = 1;
}
