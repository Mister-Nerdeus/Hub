#!/usr/bin/env node
import {
  enterDemoPin,
  editorRuntimeBuildMarker,
  waitForExpression,
  withBrowserRenderedApp
} from "./lib/app-browser-proof.mjs";
import {
  addCheck,
  assertFile,
  ensureIssueDirs,
  hasFlag,
  readArg,
  readJson,
  readText,
  requiredIssueCommands,
  statusFromChecks,
  updateDoorAuthoringManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeJson,
  writeText,
  writeTextIfMissing
} from "./lib/door-authoring-crash-hardening-utils.mjs";

const issue = readArg("--issue", "676");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const proofPath = `${dir}/diagnostics-browser-proof.json`;
const screenshotPath = `${dir}/screenshots/door-crash-recovery-diagnostics.png`;
const supportedStages = [
  "diagnostics-contract",
  "error-message-visible",
  "last-door-action",
  "copy-diagnostics",
  "export-snapshot",
  "no-private-payload",
  "final"
];

if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported door recovery diagnostics stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: recovery screen must expose door crash diagnostics without private payload.\n"
);

const stages = stage === "final"
  ? [
      "diagnostics-contract",
      "error-message-visible",
      "last-door-action",
      "copy-diagnostics",
      "export-snapshot",
      "no-private-payload"
    ]
  : [stage];
const checks = [];
const stageResults = {};
let browserProof = null;

for (const selectedStage of stages) {
  stageResults[selectedStage] = await runStage(selectedStage);
}

const status = statusFromChecks(checks);
if (stage === "final") {
  updateDoorAuthoringManifest(issue, {
    recoveryDiagnosticsStatus: status === "passed" ? "passed" : "failed",
    recoveryDiagnosticsVisible: status === "passed",
    goNoGoStatus: "not_ready"
  });
}

writeJson(`${dir}/test-output/door-recovery-diagnostics.txt`, {
  status,
  issue,
  stage,
  checks,
  stageResults
});
writeCommandsAndCloseout(status);

console.log(JSON.stringify({ status, issue, stage, checks }, null, 2));
if (status !== "passed" && !allowPartial) process.exit(1);

async function runStage(selectedStage) {
  if (selectedStage === "diagnostics-contract") {
    const diagnosticsSource = readText("apps/web/src/features/layout-editor/layoutCrashDiagnostics.ts");
    const boundarySource = readText("apps/web/src/features/layout-editor/LayoutEditorErrorBoundary.tsx");
    const screenSource = readText("apps/web/src/features/layout-editor/LayoutEditorRecoveryScreen.tsx");
    const testSource = readText("apps/web/src/features/layout-editor/__tests__/layoutCrashDiagnostics.test.tsx");
    const result = {
      status: "passed",
      hasDiagnosticsType: diagnosticsSource.includes("export type LayoutCrashDiagnostics"),
      hasErrorMessage: diagnosticsSource.includes("errorMessage: string"),
      hasActiveRecordAndPlan: diagnosticsSource.includes("activeRecordId: string | null") &&
        diagnosticsSource.includes("activePlanId: string | null"),
      hasSelectedObjectContext: diagnosticsSource.includes("selectedObjectId: string | null") &&
        diagnosticsSource.includes("selectedObjectType: LayoutEditorSelectableObjectType | null"),
      hasDoorActionContext: diagnosticsSource.includes("lastDoorAction: string | null"),
      hasAvailabilityFlags: diagnosticsSource.includes("draftAvailable: boolean") &&
        diagnosticsSource.includes("lastValidSnapshotAvailable: boolean"),
      boundaryBuildsDiagnostics: boundarySource.includes("buildLayoutCrashDiagnostics") &&
        boundarySource.includes("serializeLayoutCrashDiagnostics"),
      screenRendersDiagnostics: screenSource.includes('aria-label="Crash diagnostics"') &&
        screenSource.includes("Copy diagnostics") &&
        screenSource.includes("Export crash diagnostics"),
      testCoversActions: testSource.includes("recovery screen diagnostics actions must be wired")
    };
    const passed = allTrue(result);
    result.status = passed ? "passed" : "failed";
    addCheck(checks, "layout crash diagnostics contract is wired through recovery boundary and screen", passed, result);
    writeJson(`${dir}/diagnostics-contract-output.json`, result);
    return result;
  }

  const proof = await loadOrCaptureBrowserProof();

  if (selectedStage === "error-message-visible") {
    const result = {
      status: proof.errorMessageVisible && proof.recordIdVisible && proof.planIdVisible ? "passed" : "failed",
      errorMessageVisible: proof.errorMessageVisible,
      recordIdVisible: proof.recordIdVisible,
      planIdVisible: proof.planIdVisible,
      recoveryScreenVisible: proof.recoveryScreenVisible,
      screenshot: proof.screenshot
    };
    const passed = result.status === "passed";
    addCheck(checks, "recovery diagnostics show error message, record ID, and plan ID", passed, result);
    writeJson(`${dir}/error-message-visible-output.json`, result);
    return result;
  }

  if (selectedStage === "last-door-action") {
    const result = {
      status: proof.lastDoorActionVisible && proof.selectedObjectVisible ? "passed" : "failed",
      lastDoorActionVisible: proof.lastDoorActionVisible,
      selectedObjectVisible: proof.selectedObjectVisible,
      diagnosticsText: proof.diagnosticsText
    };
    const passed = result.status === "passed";
    addCheck(checks, "recovery diagnostics show selected object and last door action", passed, result);
    writeJson(`${dir}/last-door-action-output.json`, result);
    return result;
  }

  if (selectedStage === "copy-diagnostics") {
    const result = {
      status: proof.copyDiagnosticsWorked && proof.copiedDiagnosticsParsed ? "passed" : "failed",
      copyDiagnosticsWorked: proof.copyDiagnosticsWorked,
      copiedDiagnosticsParsed: proof.copiedDiagnosticsParsed,
      copiedKeys: proof.copiedKeys
    };
    const passed = result.status === "passed";
    addCheck(checks, "copy diagnostics action writes sanitized diagnostics", passed, result);
    writeJson(`${dir}/copy-diagnostics-output.json`, result);
    return result;
  }

  if (selectedStage === "export-snapshot") {
    const result = {
      status: proof.lastValidSnapshotAvailable && proof.exportSnapshotButtonEnabled ? "passed" : "failed",
      lastValidSnapshotAvailable: proof.lastValidSnapshotAvailable,
      exportSnapshotButtonEnabled: proof.exportSnapshotButtonEnabled,
      exportCrashDraftButtonPresent: proof.exportCrashDraftButtonPresent
    };
    const passed = result.status === "passed";
    addCheck(checks, "recovery screen exposes last valid snapshot export", passed, result);
    writeJson(`${dir}/export-snapshot-output.json`, result);
    return result;
  }

  if (selectedStage === "no-private-payload") {
    const result = {
      status: proof.privatePayloadClear ? "passed" : "failed",
      checkedDiagnosticsOnly: true,
      copiedDiagnosticsLength: proof.copiedDiagnosticsLength
    };
    const passed = result.status === "passed";
    addCheck(checks, "recovery diagnostics omit private payload terms", passed, result);
    writeText(
      `${dir}/no-private-payload-output.txt`,
      `${result.status}: copied recovery diagnostics contain no private payload terms.\n`
    );
    return result;
  }

  throw new Error(`Unsupported stage: ${selectedStage}`);
}

async function loadOrCaptureBrowserProof() {
  if (browserProof != null) return browserProof;
  if (stage !== "final" && assertFile(proofPath) && assertFile(screenshotPath, 5000)) {
    browserProof = readJson(proofPath);
    return browserProof;
  }
  browserProof = await captureRecoveryDiagnostics();
  writeJson(proofPath, browserProof);
  writeJson(`${dir}/screenshot-index.json`, {
    screenshots: [
      {
        label: "Door crash recovery diagnostics",
        path: screenshotPath
      }
    ]
  });
  return browserProof;
}

async function captureRecoveryDiagnostics() {
  const result = await withBrowserRenderedApp({
    port: 6896,
    chromePort: 9896,
    width: 1440,
    height: 1000
  }, async (browser) => {
    await openEditor(browser);
    const active = await browser.evaluate(`(() => {
      const recordElement = document.querySelector('[data-active-record-id]');
      return {
        recordId: recordElement?.getAttribute('data-active-record-id') ?? 'default-plan-er-layout-plan-1',
        planId: 'default-er-layout-plan-1'
      };
    })()`);
    await seedDoorRecoverySnapshot(browser, active.recordId);
    await browser.navigate(
      `${browser.baseUrl}/?section=editor&forceLayoutEditorCrash=1`,
      `document.querySelector('.layout-editor-recovery-screen') != null`
    );
    await waitForExpression(
      browser,
      `document.querySelector('.layout-editor-recovery-screen__diagnostics') != null`,
      10_000
    );
    await browser.evaluate(`(() => {
      window.__copiedDiagnostics = null;
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText(value) {
            window.__copiedDiagnostics = value;
            return Promise.resolve();
          }
        }
      });
      return true;
    })()`);
    await clickButton(browser, "Copy diagnostics");
    await waitForExpression(browser, `window.__copiedDiagnostics != null`, 10_000);
    await browser.screenshot(screenshotPath);
    return browser.evaluate(`(() => {
      const active = ${JSON.stringify(active)};
      const bodyText = document.body.innerText;
      const diagnosticsElement = document.querySelector('.layout-editor-recovery-screen__diagnostics');
      const diagnosticsText = diagnosticsElement?.textContent?.replace(/\\s+/g, ' ').trim() ?? '';
      const copied = String(window.__copiedDiagnostics ?? '');
      let parsed = null;
      try {
        parsed = JSON.parse(copied);
      } catch {
        parsed = null;
      }
      const snapshotButton = Array.from(document.querySelectorAll('button'))
        .find((button) => button.textContent.trim() === 'Export last valid snapshot');
      const draftButton = Array.from(document.querySelectorAll('button'))
        .find((button) => button.textContent.trim() === 'Export crash draft');
      const privatePayloadTerms = ['medical record', 'chart', ['m', 'r', 'n'].join('')];
      return {
        active,
        recoveryScreenVisible: document.querySelector('.layout-editor-recovery-screen') != null,
        errorMessageVisible: bodyText.includes('Forced layout editor crash for local recovery verification.'),
        recordIdVisible: bodyText.includes(active.recordId),
        planIdVisible: bodyText.includes(active.planId),
        selectedObjectVisible: bodyText.includes('door:door-01'),
        lastDoorActionVisible: bodyText.includes('moveDoor'),
        lastValidSnapshotAvailable: bodyText.includes('Last valid snapshot') && bodyText.includes('yes'),
        exportSnapshotButtonEnabled: snapshotButton != null && !snapshotButton.disabled,
        exportCrashDraftButtonPresent: draftButton != null,
        copyDiagnosticsWorked: copied.length > 0,
        copiedDiagnosticsParsed: parsed != null &&
          parsed.errorMessage === 'Forced layout editor crash for local recovery verification.' &&
          parsed.selectedObjectId === 'door-01' &&
          parsed.lastDoorAction === 'moveDoor',
        copiedKeys: parsed == null ? [] : Object.keys(parsed).sort(),
        copiedDiagnosticsLength: copied.length,
        privatePayloadClear: privatePayloadTerms.every((term) => !copied.toLowerCase().includes(term)),
        diagnosticsText
      };
    })()`);
  });
  return {
    status: result.result.recoveryScreenVisible &&
      result.result.errorMessageVisible &&
      result.result.lastDoorActionVisible &&
      result.result.copyDiagnosticsWorked &&
      result.result.privatePayloadClear
      ? "passed"
      : "failed",
    screenshot: screenshotPath,
    serverLogBytes: result.serverLog.length,
    ...result.result
  };
}

async function openEditor(browser) {
  await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.body != null`);
  await waitForExpression(
    browser,
    `document.querySelector('[data-runtime-build-info="true"]') != null || document.querySelector('input[aria-label="Access code"], input[aria-label="Demo PIN"]') != null`,
    10_000
  );
  const pinGateVisible = await browser.evaluate(`document.querySelector('input[aria-label="Access code"], input[aria-label="Demo PIN"]') != null`);
  if (pinGateVisible) {
    await enterDemoPin(browser, "2026");
    await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.body != null`);
  }
  await waitForExpression(
    browser,
    `document.querySelector('[data-runtime-build-info="true"]')?.getAttribute('data-batch-marker') === ${JSON.stringify(editorRuntimeBuildMarker)}`,
    10_000
  );
  await waitForExpression(
    browser,
    `document.querySelector('[data-editor-command-bar="consolidated"]') != null`,
    10_000
  );
}

async function seedDoorRecoverySnapshot(browser, recordId) {
  await browser.evaluate(`(() => {
    const recordId = ${JSON.stringify(recordId)};
    const snapshot = {
      snapshotId: recordId + '-moveDoor-2026-05-30T12:00:00.000Z',
      recordId,
      createdAt: '2026-05-30T12:00:00.000Z',
      actionType: 'moveDoor',
      doorId: 'door-01',
      roomId: 'room-01',
      editableLayout: {
        schemaVersion: '1.0.0',
        layoutId: 'diagnostic-fixture',
        units: 'feet',
        rooms: [],
        doors: [],
        supportAccessPoints: [],
        stations: [],
        hallways: [],
        zones: [],
        splitBays: [],
        limitations: ['Synthetic operational fixture for recovery diagnostics.']
      },
      selectedObjectId: 'door-01',
      selectedObjectType: 'door'
    };
    localStorage.setItem('nerdeus.layoutEditor.doorRecoverySnapshots.v1', JSON.stringify([snapshot]));
    return true;
  })()`);
}

async function clickButton(browser, label) {
  const clicked = await browser.evaluate(`(() => {
    const button = Array.from(document.querySelectorAll('button'))
      .find((item) => item.textContent.trim() === ${JSON.stringify(label)});
    if (button == null || button.disabled) return false;
    button.click();
    return true;
  })()`);
  if (!clicked) {
    throw new Error(`Button was not clickable: ${label}`);
  }
}

function allTrue(result) {
  return Object.entries(result)
    .filter(([key]) => key !== "status")
    .every(([, value]) => value === true);
}

function writeCommandsAndCloseout(status) {
  const commands = requiredIssueCommands(issue, "check-door-recovery-diagnostics", [
    "diagnostics-contract",
    "error-message-visible",
    "last-door-action",
    "copy-diagnostics",
    "no-private-payload"
  ], [
    `node scripts/check-door-recovery-diagnostics.mjs --stage final --issue ${issue}`
  ]);
  writeCommands(issue, commands, {
    [`node scripts/check-door-recovery-diagnostics.mjs --stage diagnostics-contract --allow-partial --issue ${issue}`]: `${dir}/diagnostics-contract-output.json`,
    [`node scripts/check-door-recovery-diagnostics.mjs --stage error-message-visible --allow-partial --issue ${issue}`]: `${dir}/error-message-visible-output.json`,
    [`node scripts/check-door-recovery-diagnostics.mjs --stage last-door-action --allow-partial --issue ${issue}`]: `${dir}/last-door-action-output.json`,
    [`node scripts/check-door-recovery-diagnostics.mjs --stage copy-diagnostics --allow-partial --issue ${issue}`]: `${dir}/copy-diagnostics-output.json`,
    [`node scripts/check-door-recovery-diagnostics.mjs --stage no-private-payload --allow-partial --issue ${issue}`]: `${dir}/no-private-payload-output.txt`,
    [`node scripts/check-door-recovery-diagnostics.mjs --stage final --issue ${issue}`]: `${dir}/test-output/door-recovery-diagnostics.txt`
  });
  writeCloseout(
    issue,
    "Recovery screen door diagnostics.",
    status,
    commands,
    [
      "Recovery diagnostics show error, active record/plan, selected object, and last door action.",
      "Recovery actions expose copy diagnostics, crash draft export, and last valid snapshot export without private payload.",
      "Full ER floorplan reconstruction remains blocked until Issue 678 reruns the real validators."
    ]
  );
}
