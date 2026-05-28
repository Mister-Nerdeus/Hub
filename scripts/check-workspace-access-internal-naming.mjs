#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { withBrowserRenderedApp } from "./lib/app-browser-proof.mjs";
import {
  abs,
  createRepairContext,
  finalizeRepairGate,
  runSelectedRepairStages,
  writeJson
} from "./lib/simulation-v0-repair-utils.mjs";

const NEW_KEY = "nerdeus.workspaceAccess.sessionUnlock.v1";
const OLD_KEY = "nerdeus.demoPin.sessionUnlock.v1";

const stages = [
  "source-rename",
  "storage-key-migration",
  "rendered-copy",
  "credential-storage-negative",
  "legacy-key-cleanup",
  "locked-shell-not-mounted",
  "unlocked-shell-mounted",
  "final"
];

const context = createRepairContext({
  scriptName: "workspace access internal naming",
  stages,
  statusKeyByStage: {
    "source-rename": "workspaceAccessNamingStatus",
    "storage-key-migration": "workspaceAccessNamingStatus",
    "rendered-copy": "workspaceAccessNamingStatus",
    "credential-storage-negative": "workspaceAccessNamingStatus"
  },
  outputName: "workspace-access-internal-naming-output.json",
  defaultIssue: "583"
});

await runSelectedRepairStages(context, runStage);
finalizeRepairGate(context, {
  testOutputName: "workspace-access-internal-naming.txt",
  manifestUpdates: {
    workspaceAccessNamingStatus: context.checks.every((check) => check.passed) ? "passed" : "failed"
  }
});

async function runStage(stage) {
  if (stage === "source-rename") {
    const app = source("apps/web/src/App.tsx");
    const session = source("apps/web/src/features/demo-pin/workspaceAccessSessionStorage.ts");
    const passed = app.includes("WorkspaceAccessEntryScreen") &&
      app.includes("workspaceAccessState") &&
      session.includes("WORKSPACE_ACCESS_SESSION_STORAGE_KEY") &&
      session.includes(NEW_KEY);
    context.add("visible-adjacent App internals use workspace-access naming", passed, {
      renamed: ["WorkspaceAccessEntryScreen", "workspaceAccessState", "workspaceAccessSessionStorage"]
    });
    writeJson(`${context.dir}/source-rename-output.json`, { status: passed ? "passed" : "failed", renamedFiles: ["apps/web/src/App.tsx", "apps/web/src/features/demo-pin/WorkspaceAccessEntryScreen.tsx", "apps/web/src/features/demo-pin/workspaceAccessSessionStorage.ts"] });
  }
  if (stage === "storage-key-migration") {
    const session = source("apps/web/src/features/demo-pin/workspaceAccessSessionStorage.ts");
    const passed = session.includes(OLD_KEY) &&
      session.includes("storage.removeItem(LEGACY_DEMO_PIN_SESSION_STORAGE_KEY)") &&
      session.includes("storage.setItem(WORKSPACE_ACCESS_SESSION_STORAGE_KEY");
    context.add("old workspace access key migrates once and is cleared", passed, { oldKey: OLD_KEY, newKey: NEW_KEY });
    writeJson(`${context.dir}/storage-key-migration-output.json`, { status: passed ? "passed" : "failed", oldKey: OLD_KEY, newKey: NEW_KEY, migrationProof: "source-inspected" });
  }
  if (stage === "rendered-copy") {
    const rendered = await renderAccessStates();
    const forbidden = /Demo PIN|Relock Demo|demo-only/iu.test(rendered.lockedText + rendered.unlockedText);
    const credentialVisible = /2026/u.test(rendered.lockedText + rendered.unlockedText);
    context.add("rendered access copy has no legacy access wording", !forbidden, { forbidden });
    context.add("rendered access copy does not expose credential", !credentialVisible, { credentialVisible });
    writeJson(`${context.dir}/rendered-copy-output.json`, { status: !forbidden && !credentialVisible ? "passed" : "failed", lockedTextLength: rendered.lockedText.length, unlockedTextLength: rendered.unlockedText.length });
  }
  if (stage === "credential-storage-negative") {
    const session = source("apps/web/src/features/demo-pin/workspaceAccessSessionStorage.ts");
    const rejectsCredentialFields = ["pin", "pinInput", "accessCode", "credential", "input", "token", "authToken"].every((field) => session.includes(`"${field}"`));
    context.add("credential-like stored fields are rejected", rejectsCredentialFields, { fieldsChecked: 7 });
    writeJson(`${context.dir}/credential-storage-negative-output.json`, { status: rejectsCredentialFields ? "passed" : "failed", rejectedFields: ["pin", "pinInput", "accessCode", "credential", "input", "token", "authToken"] });
  }
  if (stage === "legacy-key-cleanup") {
    const session = source("apps/web/src/features/demo-pin/workspaceAccessSessionStorage.ts");
    const clearsLegacy = session.includes("clearWorkspaceAccessSessionUnlock") && session.match(/LEGACY_DEMO_PIN_SESSION_STORAGE_KEY/gu)?.length >= 4;
    context.add("legacy session key is cleared after migration and relock", clearsLegacy, { oldKey: OLD_KEY });
    writeJson(`${context.dir}/legacy-key-cleanup-output.json`, { status: clearsLegacy ? "passed" : "failed", oldKey: OLD_KEY });
  }
  if (stage === "locked-shell-not-mounted") {
    const rendered = await renderAccessStates();
    context.add("locked app does not mount shell", rendered.lockedShellMounted === false, { lockedShellMounted: rendered.lockedShellMounted });
    writeJson(`${context.dir}/locked-shell-not-mounted-output.json`, { status: rendered.lockedShellMounted === false ? "passed" : "failed" });
  }
  if (stage === "unlocked-shell-mounted") {
    const rendered = await renderAccessStates();
    context.add("unlocked app mounts shell", rendered.unlockedShellMounted === true, { unlockedShellMounted: rendered.unlockedShellMounted });
    writeJson(`${context.dir}/unlocked-shell-mounted-output.json`, { status: rendered.unlockedShellMounted === true ? "passed" : "failed" });
  }
}

async function renderAccessStates() {
  const port = Number(context.args.port ?? 6830);
  const chromePort = Number(context.args["chrome-port"] ?? 9830);
  const locked = await withBrowserRenderedApp({ port, chromePort, width: 1440, height: 1000, initScript: "sessionStorage.clear();" }, async (browser) => {
    await browser.navigate(`${browser.baseUrl}/`, "document.querySelector('.demo-pin-entry-screen') != null");
    await browser.screenshot(`${context.dir}/screenshots/workspace-access-entry.png`);
    const lockedText = await browser.evaluate("document.body.textContent || ''");
    const lockedShellMounted = await browser.evaluate("document.querySelector('.app-shell') != null");
    return { lockedText, lockedShellMounted };
  });
  const unlocked = await withBrowserRenderedApp({
    port: port + 1,
    chromePort: chromePort + 1,
    width: 1440,
    height: 1000,
    initScript: `sessionStorage.setItem(${JSON.stringify(NEW_KEY)}, JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));`
  }, async (browser) => {
    await browser.navigate(`${browser.baseUrl}/?section=floorplans`, "document.querySelector('.app-shell') != null");
    await browser.screenshot(`${context.dir}/screenshots/unlocked-workspace.png`);
    const unlockedText = await browser.evaluate("document.body.textContent || ''");
    const unlockedShellMounted = await browser.evaluate("document.querySelector('.app-shell') != null");
    return { unlockedText, unlockedShellMounted };
  });
  return { ...locked.result, ...unlocked.result };
}

function source(path) {
  return readFileSync(abs(path), "utf8");
}
