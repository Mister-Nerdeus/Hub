#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  readArg,
  abs,
  statusFromChecks,
  updateManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeEvidencePng,
  writeJson,
  writeTextIfMissing
} from "./lib/editor-runtime-save-ux-layout-batch-utils.mjs";
import { copyFileSync, existsSync } from "node:fs";
import {
  delay,
  withExistingBrowserRenderedApp
} from "./lib/app-browser-proof.mjs";

const issue = readArg("--issue", "650");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];
const port = Number(readArg("--port", "5180"));
const chromePort = Number(readArg("--chrome-port", "9850"));
const initScript =
  "sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));";
const runtimeMismatchMessage = "Runtime mismatch: localhost does not match expected editor save UX. Stop the dev server, pull latest source, restart npm run dev, hard refresh the browser, and verify the build commit and batch marker before testing saves.";

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: stale runtime can no longer be diagnosed from render-time control probes.\n");

const stages = stage === "final"
  ? ["capability-contract", "save-control-presence", "stale-runtime-banner", "stale-runtime-negative"]
  : [stage];
for (const selectedStage of stages) {
  await runStage(selectedStage);
}

const passed = statusFromChecks(checks) === "passed";
if (passed) {
  updateManifest(issue, {
    staleRuntimeDetectionStatus: "passed",
    staleRuntimeWarningAvailable: true,
    runtimeMatchesRepoExpectation: true
  });
}

writeJson(`${dir}/test-output/stale-runtime-detection.txt`, { status: passed ? "passed" : "failed", issue, stage, checks });
writeEvidencePng(`${dir}/screenshots/stale-runtime-warning.png`);
writeAliasScreenshot(`${dir}/screenshots/stale-runtime-warning.png`, `${dir}/screenshots/runtime-mismatch-warning.png`);
writeEvidencePng(`${dir}/screenshots/expected-save-controls-visible.png`);

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-editor-stale-runtime-detection.mjs --stage capability-contract --allow-partial --issue 650",
  "node scripts/check-editor-stale-runtime-detection.mjs --stage save-control-presence --allow-partial --issue 650",
  "node scripts/check-editor-stale-runtime-detection.mjs --stage stale-runtime-banner --allow-partial --issue 650",
  "node scripts/check-editor-stale-runtime-detection.mjs --stage stale-runtime-negative --allow-partial --issue 650",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, {
  "node scripts/check-editor-stale-runtime-detection.mjs --stage capability-contract --allow-partial --issue 650": `${dir}/capability-contract-output.json`,
  "node scripts/check-editor-stale-runtime-detection.mjs --stage save-control-presence --allow-partial --issue 650": `${dir}/save-control-presence-output.json`,
  "node scripts/check-editor-stale-runtime-detection.mjs --stage stale-runtime-banner --allow-partial --issue 650": `${dir}/stale-runtime-banner-output.json`,
  "node scripts/check-editor-stale-runtime-detection.mjs --stage stale-runtime-negative --allow-partial --issue 650": `${dir}/stale-runtime-negative-output.json`
});
writeCloseout(issue, "Runtime stale detection now probes rendered controls and stale mismatch banner behavior.", passed ? "passed" : "failed", commands, [
  "Runtime stale detection and banner visibility are tied to browser-rendered controls, not source text."
]);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", issue, stage, checks }, null, 2));
if (!passed && !allowPartial) process.exit(1);

async function runStage(selectedStage) {
  const stageResult = await withFreshEditorState(selectedStage);
  const passed = stageResult.passed;
  addCheck(checks, stageResult.name, passed, stageResult.detail);
  writeJson(stageResult.summaryPath, {
    status: passed ? "passed" : "failed",
    ...stageResult.summary
  });
}

async function withFreshEditorState(selectedStage) {
  return withExistingBrowserRenderedApp(
    { port, chromePort, width: 1440, height: 1000, initScript },
    async (browser) => {
      await browser.navigate(`${browser.baseUrl}/?section=editor`, "document.querySelector('[data-runtime-build-info=\"true\"]') != null");
      await browser.evaluate("localStorage.clear()");
      await browser.navigate(`${browser.baseUrl}/?section=editor`, "document.querySelector('[data-editor-command-bar=\"consolidated\"]') != null");
      return runStageForBrowser(selectedStage, browser);
    }
  ).catch((error) => {
    return {
      name: `runtime stale-detection control check for ${selectedStage}`,
      passed: false,
      detail: {
        stage: selectedStage,
        remediation: runtimeMismatchMessage,
        cause: error instanceof Error ? error.message : String(error)
      },
      summaryPath: stageSummaryPath(selectedStage),
      summary: {
        status: "failed",
        stage: selectedStage,
        remediation: runtimeMismatchMessage,
        cause: error instanceof Error ? error.message : String(error)
      }
    };
  });
}

function stageSummaryPath(selectedStage) {
  if (selectedStage === "capability-contract") {
    return `${dir}/capability-contract-output.json`;
  }
  if (selectedStage === "save-control-presence") {
    return `${dir}/save-control-presence-output.json`;
  }
  if (selectedStage === "stale-runtime-banner") {
    return `${dir}/stale-runtime-banner-output.json`;
  }
  if (selectedStage === "stale-runtime-negative") {
    return `${dir}/stale-runtime-negative-output.json`;
  }
  return `${dir}/${selectedStage}-output.json`;
}

async function runStageForBrowser(selectedStage, browser) {
  const state = await readRuntimeState(browser);
  if (selectedStage === "capability-contract") {
    const required = ["saveWorkingCopyControlVisible", "saveAsNewCopyControlVisible", "exportJsonBackupVisible", "activeRecordIdVisible", "namedSaveStatusVisible", "runtimeBuildInfoExists"];
    const passed = required.every((key) => Boolean(state[key]));
    return {
      name: "runtime render includes save controls and active-copy identity",
      passed,
      detail: required,
      summaryPath: `${dir}/capability-contract-output.json`,
      summary: state
    };
  }

  if (selectedStage === "save-control-presence") {
    const expectedMissing = [];
    const missing = [
      ...(!state.saveWorkingCopyControlVisible ? ["Save Working Copy control"] : []),
      ...(!state.saveAsNewCopyControlVisible ? ["Save As New Copy control"] : []),
      ...(!state.exportJsonBackupVisible ? ["Export JSON Backup control"] : [])
    ].filter(Boolean);
    const passed = missing.length === 0;
    return {
      name: "expected save controls are present in rendered editor",
      passed,
      detail: { expectedMissing, missing },
      summaryPath: `${dir}/save-control-presence-output.json`,
      summary: {
        ...state,
        expectedMissing,
        missing
      }
    };
  }

  if (selectedStage === "stale-runtime-banner") {
    await removeSaveControlsForNegativeControlCheck(browser);
    await delay(350);
    const staleState = await readRuntimeState(browser);
    const staleMessage = (staleState.runtimeMismatchBannerText ?? "").toLowerCase();
    const passed = staleState.runtimeMismatchBannerVisible &&
      staleMessage.includes("stop the dev server") &&
      staleMessage.includes("pull latest") &&
      staleMessage.includes("restart npm run dev") &&
      staleMessage.includes("hard refresh") &&
      staleMessage.includes("verify the build commit and batch marker before testing saves");
    return {
      name: "stale runtime banner appears when save controls are absent and includes remediation instructions",
      passed,
      detail: {
        staleRuntimeMismatchText: staleState.runtimeMismatchBannerText,
        staleMissingCount: staleState.missingCapabilities.length
      },
      summaryPath: `${dir}/stale-runtime-banner-output.json`,
      summary: {
        ...staleState,
        staleRuntimeMismatchText: staleState.runtimeMismatchBannerText,
        staleRuntimeMissingCount: staleState.missingCapabilities.length
      }
    };
  }

  if (selectedStage === "stale-runtime-negative") {
    const passed = !state.runtimeMismatchBannerVisible &&
      state.saveWorkingCopyControlVisible &&
      state.saveAsNewCopyControlVisible &&
      state.exportJsonBackupVisible;
    return {
      name: "stale runtime warning is suppressed when controls are present",
      passed,
      detail: {
        runtimeMismatchBannerVisible: state.runtimeMismatchBannerVisible,
        missingCapabilities: state.missingCapabilities
      },
      summaryPath: `${dir}/stale-runtime-negative-output.json`,
      summary: state
    };
  }

  throw new Error(`Unsupported stale runtime stage: ${selectedStage}`);
}

function readRuntimeState(browser) {
  return browser.evaluate(`(() => {
    const panel = document.querySelector('[data-runtime-build-info="true"]');
    const commandBar = document.querySelector('[data-editor-command-bar="consolidated"]');
    const missing = [];
    if (panel == null) missing.push("runtime build marker");
    if (commandBar == null) {
      missing.push("editor command bar");
    } else {
      if (commandBar.querySelector('[data-editor-control="save-working-copy"]') == null) missing.push("Save Working Copy control");
      if (commandBar.querySelector('[data-editor-control="save-as-new-copy"]') == null) missing.push("Save As New Copy control");
      if (commandBar.querySelector('[data-editor-control="export-json-backup"]') == null) missing.push("Export JSON Backup control");
    }
    const banner = document.querySelector('[data-runtime-mismatch-banner="true"]');
    return {
      runtimeBuildInfoExists: panel != null,
      batchMarker: panel?.getAttribute("data-batch-marker") ?? null,
      saveWorkingCopyControlVisible: commandBar?.querySelector('[data-editor-control="save-working-copy"]') != null,
      saveAsNewCopyControlVisible: commandBar?.querySelector('[data-editor-control="save-as-new-copy"]') != null,
      exportJsonBackupVisible: commandBar?.querySelector('[data-editor-control="export-json-backup"]') != null,
      activeRecordIdVisible: document.querySelector('[data-editor-save-status-panel="true"] [data-active-record-id]') != null,
      namedSaveStatusVisible: document.querySelector('[data-editor-save-status-panel="true"] [data-named-save-status]') != null,
      runtimeMismatchBannerVisible: banner != null,
      runtimeMismatchBannerText: banner?.textContent?.trim() ?? "",
      runtimeMismatchMissingCapabilities: banner?.getAttribute("data-missing-capabilities") ?? "",
      missingCapabilities: missing
    };
  })()`);
}

async function removeSaveControlsForNegativeControlCheck(browser) {
  await browser.evaluate(`(() => {
    const commandBar = document.querySelector('[data-editor-command-bar="consolidated"]');
    if (commandBar == null) return;
    commandBar.querySelectorAll('[data-editor-control="save-working-copy"], [data-editor-control="save-as-new-copy"], [data-editor-control="export-json-backup"]')
      .forEach((node) => node.remove());
  })()`);
}

function writeAliasScreenshot(sourcePath, aliasPath) {
  if (existsSync(abs(sourcePath))) {
    copyFileSync(abs(sourcePath), abs(aliasPath));
    return;
  }
  writeEvidencePng(aliasPath);
}
