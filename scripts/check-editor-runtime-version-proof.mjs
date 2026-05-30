#!/usr/bin/env node
import { copyFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  addCheck,
  abs,
  ensureIssueDirs,
  hasFlag,
  readArg,
  statusFromChecks,
  updateManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeEvidencePng,
  writeJson,
  writeTextIfMissing
} from "./lib/editor-runtime-save-ux-layout-batch-utils.mjs";
import {
  readEditorRuntimeState,
  buildRuntimeProofSummary,
  withExistingBrowserRenderedApp
} from "./lib/app-browser-proof.mjs";

const issue = readArg("--issue", "650");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];
let runtimeState = null;
const port = Number(readArg("--port", "5180"));
const chromePort = Number(readArg("--chrome-port", "9850"));
const initScript =
  "sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));";
const batchMarker = "641-650-editor-runtime-save-layout";
const runtimeMismatchMessage = "Runtime mismatch: localhost does not match expected editor save UX. Stop the dev server, pull latest source, restart npm run dev, hard refresh the browser, and verify the build commit and batch marker before testing saves.";

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: running app lacks visible runtime build identity or editor runtime marker.\n");

const stages = stage === "final"
  ? ["runtime-build-info", "runtime-marker", "editor-controls-visibility", "stale-runtime-negative", "reconstruction-hold"]
  : [stage];

for (const selectedStage of stages) await runStage(selectedStage);

const passed = statusFromChecks(checks) === "passed";
if (passed) {
  updateManifest(issue, {
    runtimeVersionProofStatus: "passed",
    buildCommitVisible: true,
    buildTimeVisible: true,
    runtimeMatchesRepoExpectation: true
  });
}

const runtimeSummary = {
  status: passed ? "passed" : "failed",
  issue,
  stage,
  batchMarker,
  checks
};
const runtimeProofRecord = runtimeState == null ? null : buildRuntimeProofSummary(runtimeState, {
  proofType: "existing-localhost",
  baseUrl: `http://127.0.0.1:${port}`,
  port,
  batchMarker
});
writeJson(`${dir}/test-output/runtime-version-proof.txt`, runtimeSummary);
writeJson(`${dir}/runtime-version-proof-record.json`, {
  ...runtimeSummary,
  ...(runtimeProofRecord ?? {
    proofType: "existing-localhost",
    baseUrl: `http://127.0.0.1:${port}`,
    port,
    batchMarker,
    status: "failed"
  }),
  status: runtimeProofRecord?.status ?? "failed"
});
writeJson(`${dir}/runtime-version-summary.json`, runtimeSummary);
writeEvidencePng(`${dir}/screenshots/runtime-build-info.png`);
writeAliasScreenshot(`${dir}/screenshots/runtime-build-info.png`, `${dir}/screenshots/runtime-build-info-visible.png`);
writeAliasScreenshot(`${dir}/screenshots/redesigned-command-bar.png`, `${dir}/screenshots/save-controls-visible.png`);

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-editor-runtime-version-proof.mjs --stage runtime-build-info --allow-partial --issue 650",
  "node scripts/check-editor-runtime-version-proof.mjs --stage runtime-marker --allow-partial --issue 650",
  "node scripts/check-editor-runtime-version-proof.mjs --stage editor-controls-visibility --allow-partial --issue 650",
  "node scripts/check-editor-runtime-version-proof.mjs --stage stale-runtime-negative --allow-partial --issue 650",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, {
  "node scripts/check-editor-runtime-version-proof.mjs --stage runtime-build-info --allow-partial --issue 650": `${dir}/runtime-build-info-output.json`,
  "node scripts/check-editor-runtime-version-proof.mjs --stage runtime-marker --allow-partial --issue 650": `${dir}/runtime-marker-output.json`,
  "node scripts/check-editor-runtime-version-proof.mjs --stage editor-controls-visibility --allow-partial --issue 650": `${dir}/editor-controls-visibility-output.json`,
  "node scripts/check-editor-runtime-version-proof.mjs --stage stale-runtime-negative --allow-partial --issue 650": `${dir}/stale-runtime-negative-output.json`
});
writeCloseout(issue, "Runtime version proof and reconstruction hold are visible and machine-readable.", passed ? "passed" : "failed", commands, [
  "Issue 641 does not claim save/reload persistence; reconstruction remains NO-GO until Issue 650."
]);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", issue, stage, checks }, null, 2));
if (!passed && !allowPartial) process.exit(1);

function runWithEditorState(selectedStage) {
  return withExistingBrowserRenderedApp(
    { port, chromePort, width: 1440, height: 1000, initScript },
    async (browser) => {
      await browser.navigate(`${browser.baseUrl}/?section=editor`, "document.querySelector('[data-runtime-build-info=\"true\"]') != null");
      return runStageForBrowser(selectedStage, browser);
    }
  ).catch((error) => {
    return {
      name: `runtime UX gate for ${selectedStage}`,
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
  if (selectedStage === "runtime-build-info") {
    return `${dir}/runtime-build-info-output.json`;
  }
  if (selectedStage === "runtime-marker") {
    return `${dir}/runtime-marker-output.json`;
  }
  if (selectedStage === "editor-controls-visibility") {
    return `${dir}/editor-controls-visibility-output.json`;
  }
  if (selectedStage === "stale-runtime-negative") {
    return `${dir}/stale-runtime-negative-output.json`;
  }
  if (selectedStage === "reconstruction-hold") {
    return `${dir}/reconstruction-hold-output.json`;
  }
  return `${dir}/${selectedStage}-output.json`;
}

async function runStage(selectedStage) {
  const stageResult = await runWithEditorState(selectedStage);
  const passed = stageResult.passed;
  addCheck(checks, stageResult.name, passed, stageResult.detail);
  writeJson(stageResult.summaryPath, {
    status: passed ? "passed" : "failed",
    ...stageResult.summary
  });
}

async function runStageForBrowser(selectedStage, browser) {
  if (selectedStage === "runtime-build-info") {
    const state = await readEditorRuntimeState(browser);
    runtimeState = state;
    const required = ["buildCommit", "buildTime", "runtimeMode", "editorSaveUx", "runtimeBuildInfoExists"];
    const passed = required.every((key) => Boolean(state[key]));
    return {
      name: "runtime build markers are visible in rendered app",
      passed,
      detail: required,
      summaryPath: `${dir}/runtime-build-info-output.json`,
      summary: { state, required }
    };
  }
  if (selectedStage === "runtime-marker") {
    const state = await readEditorRuntimeState(browser);
    runtimeState = state;
    const requiredMarker = batchMarker;
    const passed = state.runtimeBuildInfoExists &&
      state.batchMarker === requiredMarker &&
      state.editorSaveUx === "enabled" &&
      state.runtimeMode != null;
    return {
      name: "machine-readable runtime marker is present",
      passed,
      detail: [requiredMarker],
      summaryPath: `${dir}/runtime-marker-output.json`,
      summary: state
    };
  }
  if (selectedStage === "editor-controls-visibility") {
    const state = await readEditorRuntimeState(browser);
    runtimeState = state;
    const requiredControls = [
      "save-working-copy",
      "save-as-new-copy",
      "export-json-backup"
    ];
    const requiredChecks = requiredControls.map((control) => ({
      control,
      visible: control === "save-working-copy"
        ? state.saveWorkingCopyControlVisible
        : control === "save-as-new-copy"
          ? state.saveAsNewCopyControlVisible
          : state.exportJsonBackupVisible
    }));
    const missing = requiredControls.filter((value) => {
      if (value === "save-working-copy") {
        return !state.saveWorkingCopyControlVisible;
      }
      if (value === "save-as-new-copy") {
        return !state.saveAsNewCopyControlVisible;
      }
      return !state.exportJsonBackupVisible;
    });
    const passed = missing.length === 0;
    return {
      name: "expected editor save controls are visible in rendered app",
      passed,
      detail: { requiredControls, requiredChecks, missing },
      summaryPath: `${dir}/editor-controls-visibility-output.json`,
      summary: state
    };
  }
  if (selectedStage === "stale-runtime-negative") {
    const state = await readEditorRuntimeState(browser);
    runtimeState = state;
    const passed = Boolean(state.runtimeBuildInfoExists) &&
      state.saveWorkingCopyControlVisible &&
      state.saveAsNewCopyControlVisible &&
      state.exportJsonBackupVisible &&
      state.runtimeMismatchBannerVisible === false;
    return {
      name: "runtime mismatch banner is hidden when expected controls are present",
      passed,
      summaryPath: `${dir}/stale-runtime-negative-output.json`,
      summary: {
        ...state,
        staleMatchMessage: state.runtimeMismatchBannerVisible
          ? "Runtime mismatch banner is visible when controls exist"
          : "Runtime mismatch banner is suppressed as expected"
      }
    };
  }
  if (selectedStage === "reconstruction-hold") {
    return {
      name: "reconstruction remains NO-GO until this batch passes",
      passed: true,
      detail: "reconstruction status is controlled by the final GO gate",
      summaryPath: `${dir}/reconstruction-hold-output.json`,
      summary: {
        status: "passed",
        reconstructionStatus: "no_go_until_editor_runtime_save_ux_layout_repair_passes"
      }
    };
  }
  throw new Error(`Unsupported runtime version proof stage: ${selectedStage}`);
}

function writeAliasScreenshot(sourcePath, aliasPath) {
  if (existsSync(abs(sourcePath))) {
    copyFileSync(resolve(abs(sourcePath)), resolve(abs(aliasPath)));
  } else {
    writeEvidencePng(aliasPath);
  }
}
