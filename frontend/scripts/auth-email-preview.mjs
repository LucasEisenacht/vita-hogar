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
  "change_email",
  "confirm_signup",
  "reset_password",
  "welcome",
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

function getWelcomeFixture() {
  return {
    confirmedAt: "2026-07-26T18:45:00.000Z",
    createdAt: "2026-07-26T18:12:00.000Z",
    email: "lucas.preview@example.com",
    eventType: "user_welcome",
    firstName: "Lucas",
    fullName: "Lucas 2",
    userId: "00000000-0000-4000-8000-000000000101",
  };
}

function renderEmail(eventType) {
  if (eventType === "welcome") {
    return require(path.join(
      projectRoot,
      "src/lib/email/templates/user-welcome.ts",
    )).renderUserWelcomeEmail(getWelcomeFixture());
  }

  return require(path.join(
    projectRoot,
    "src/lib/email/templates/auth-supabase.ts",
  )).renderSupabaseAuthEmail(eventType);
}

function main() {
  const eventType = getArgumentValue("--event") ?? "confirm_signup";

  if (!supportedEvents.has(eventType)) {
    throw new Error(
      `Evento no soportado. Usa uno de: ${Array.from(supportedEvents).join(", ")}`,
    );
  }

  installTypeScriptRuntime();

  const email = renderEmail(eventType);
  const outputDir = path.join(projectRoot, "auth-email-previews");

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, `${eventType}.html`), email.html, "utf8");
  fs.writeFileSync(path.join(outputDir, `${eventType}.txt`), email.text, "utf8");

  console.log(`Preview generado: auth-email-previews/${eventType}.html`);
  console.log(`Texto plano: auth-email-previews/${eventType}.txt`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : "Auth email preview failed.");
  process.exitCode = 1;
}
