#!/usr/bin/env node
import { mkdirSync } from "node:fs";
import { withBrowserRenderedApp, waitForExpression, delay } from "./lib/app-browser-proof.mjs";
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  readArg,
  readText,
  statusFromChecks,
  updateSaveReloadManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeJson,
  writeTextIfMissing
} from "./lib/floorplan-editor-save-reload-batch-utils.mjs";

const stage = readArg("--stage", "final");
const issue = readArg("--issue", "638");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: save status UI still can imply named-copy persistence without reload proof.\n"
);

const stages = stage === "final"
  ? ["status-contract", "local-vs-named", "changed-not-saved-warning", "misleading-copy-negative"]
  : [stage];

let scenario = null;
for (const selectedStage of stages) {
  await runStage(selectedStage);
}

const passed = statusFromChecks(checks) === "passed";
if (passed) {
  updateSaveReloadManifest(issue, {
    truthfulSaveStatusUiStatus: "passed",
    saveStatusTruthful: true
  });
}

writeJson(`${dir}/test-output/truthful-save-status.txt`, {
  status: passed ? "passed" : "failed",
  stage,
  issue,
  checks
});

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-layout-editor-truthful-save-status.mjs --stage status-contract --allow-partial --issue 638",
  "node scripts/check-layout-editor-truthful-save-status.mjs --stage local-vs-named --allow-partial --issue 638",
  "node scripts/check-layout-editor-truthful-save-status.mjs --stage changed-not-saved-warning --allow-partial --issue 638",
  "node scripts/check-layout-editor-truthful-save-status.mjs --stage misleading-copy-negative --allow-partial --issue 638",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, {
  "node scripts/check-layout-editor-truthful-save-status.mjs --stage status-contract --allow-partial --issue 638": `${dir}/status-contract-output.json`,
  "node scripts/check-layout-editor-truthful-save-status.mjs --stage local-vs-named --allow-partial --issue 638": `${dir}/local-vs-named-status-output.json`,
  "node scripts/check-layout-editor-truthful-save-status.mjs --stage changed-not-saved-warning --allow-partial --issue 638": `${dir}/changed-not-saved-warning-output.json`,
  "node scripts/check-layout-editor-truthful-save-status.mjs --stage misleading-copy-negative --allow-partial --issue 638": `${dir}/misleading-copy-negative-output.json`
});
writeCloseout(issue, "Save status UI separates active record identity, local recovery draft, named working-copy save, dirty state, and reload proof status.", passed ? "passed" : "failed", commands, [
  "Reload proof status is displayed as not verified until browser reload validation runs; Issue 639 supplies the browser regression pack.",
  "This issue changes status language only; it does not add collaboration, optimizer, assignment recommendation, clinical, staffing, outcome, PHI, or EHR behavior."
]);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", stage, issue, checks }, null, 2));
if (!passed && !allowPartial) process.exit(1);

async function runStage(selectedStage) {
  if (selectedStage === "status-contract") {
    const viewModel = readText("apps/web/src/features/layout-editor/editorCommandBarViewModel.ts");
    const commandBar = readText("apps/web/src/features/layout-editor/EditorCommandBar.tsx");
    const stageSource = readText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx");
    const passed =
      viewModel.includes("Local editor state: changed locally") &&
      viewModel.includes("Local editor state: unchanged locally") &&
      viewModel.includes("Changes are in the local editor only") &&
      commandBar.includes("Local recovery draft") &&
      commandBar.includes("Reload proof") &&
      stageSource.includes("Named working copy not saved this session") &&
      !viewModel.includes("No unsaved edits") &&
      !commandBar.includes("No unsaved edits") &&
      !stageSource.includes("No unsaved edits");
    addCheck(checks, "status contract separates local draft, named save, dirty state, and reload proof", passed);
    writeJson(`${dir}/status-contract-output.json`, {
      status: passed ? "passed" : "failed",
      noAmbiguousNoUnsavedEdits: !`${viewModel}\n${commandBar}\n${stageSource}`.includes("No unsaved edits")
    });
    return;
  }

  scenario ??= await runTruthfulStatusScenario();

  if (selectedStage === "local-vs-named") {
    const passed =
      scenario.unsavedStatusText.includes("Local recovery draft") &&
      scenario.unsavedStatusText.includes("Named working copy") &&
      scenario.unsavedStatusText.includes("Last named-copy save") &&
      scenario.unsavedStatusText.includes("Not saved since local changes") &&
      scenario.unsavedStatusText.includes("Local editor state: changed locally") &&
      scenario.unsavedStatusText.includes(scenario.recordId);
    addCheck(checks, "UI distinguishes local recovery draft, named save, dirty state, and active record", passed, {
      recordId: scenario.recordId,
      unsavedStatusText: scenario.unsavedStatusText
    });
    writeJson(`${dir}/local-vs-named-status-output.json`, {
      status: passed ? "passed" : "failed",
      recordId: scenario.recordId,
      unsavedStatusText: scenario.unsavedStatusText
    });
    return;
  }

  if (selectedStage === "changed-not-saved-warning") {
    const passed = scenario.unsavedWarningText.includes("Changes are in the local editor only");
    addCheck(checks, "local changes warn user to save named working copy", passed, {
      unsavedWarningText: scenario.unsavedWarningText
    });
    writeJson(`${dir}/changed-not-saved-warning-output.json`, {
      status: passed ? "passed" : "failed",
      unsavedWarningText: scenario.unsavedWarningText
    });
    writeJson(`${dir}/saved-status-recordid-output.json`, {
      status: scenario.savedStatusText.includes(scenario.recordId) ? "passed" : "failed",
      recordId: scenario.recordId,
      savedStatusText: scenario.savedStatusText
    });
    writeJson(`${dir}/reload-proof-status-output.json`, {
      status: scenario.savedStatusText.includes("Not verified after latest named-copy save") ? "passed" : "failed",
      savedStatusText: scenario.savedStatusText
    });
    return;
  }

  if (selectedStage === "misleading-copy-negative") {
    const negative = detectMisleadingStatus("No unsaved edits");
    const passed =
      negative.status === "failed" &&
      !scenario.unsavedStatusText.includes("No unsaved edits") &&
      !scenario.savedStatusText.includes("No unsaved edits");
    addCheck(checks, "ambiguous No unsaved edits status cannot pass", passed, {
      negative,
      unsavedStatusText: scenario.unsavedStatusText,
      savedStatusText: scenario.savedStatusText
    });
    writeJson(`${dir}/misleading-copy-negative-output.json`, {
      status: passed ? "passed" : "failed",
      negative,
      unsavedStatusText: scenario.unsavedStatusText,
      savedStatusText: scenario.savedStatusText
    });
    return;
  }

  throw new Error(`Unsupported truthful-save-status stage: ${selectedStage}`);
}

async function runTruthfulStatusScenario() {
  mkdirSync(`${dir}/screenshots`, { recursive: true });
  const port = Number(readArg("--port", "6838"));
  const chromePort = Number(readArg("--chrome-port", "9838"));
  const initScript =
    "sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));";

  const { result } = await withBrowserRenderedApp(
    { port, chromePort, width: 1440, height: 1000, initScript },
    async (browser) => {
      await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
      await browser.evaluate("localStorage.clear()");
      await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
      await waitForExpression(browser, `document.querySelector('[aria-label="Editor status"]')?.innerText.includes('Canonical default')`, 10_000);
      await browser.evaluate(clickButton("Save working copy"));
      await waitForExpression(browser, `document.querySelector('[aria-label="Editor status"]')?.innerText.includes('Saved working copy')`, 10_000);
      const recordId = await browser.evaluate(savedRecordIdExpression());

      await dragRoom(browser, "room-02", 144, 72);
      await waitForExpression(browser, `document.querySelector('[aria-label="Editor status"]')?.innerText.includes('Local editor state: changed locally')`, 10_000);
      await browser.screenshot(`${dir}/screenshots/truthful-save-status-unsaved.png`);
      const unsavedStatusText = await statusText(browser);
      const unsavedWarningText = await warningText(browser);

      await browser.evaluate(clickButton("Save working copy"));
      await waitForExpression(browser, `document.querySelector('[aria-label="Editor status"]')?.innerText.includes('${recordId}')`, 10_000);
      await waitForExpression(browser, `document.querySelector('[aria-label="Editor status"]')?.innerText.includes('Not verified after latest named-copy save')`, 10_000);
      await browser.screenshot(`${dir}/screenshots/truthful-save-status-saved.png`);
      const savedStatusText = await statusText(browser);

      return {
        recordId,
        unsavedStatusText,
        unsavedWarningText,
        savedStatusText
      };
    }
  );

  return result;
}

async function dragRoom(browser, roomId, deltaX, deltaY) {
  await browser.evaluate(`(() => {
    const element = document.querySelector('[data-layout-object-type="room"][data-layout-object-id="${roomId}"]');
    if (element == null) throw new Error('missing room ${roomId}');
    const rect = element.getBoundingClientRect();
    const x = rect.x + rect.width / 2;
    const y = rect.y + rect.height / 2;
    const options = { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', isPrimary: true, clientX: x, clientY: y };
    element.dispatchEvent(new PointerEvent('pointerdown', options));
    element.dispatchEvent(new PointerEvent('pointermove', { ...options, clientX: x + ${deltaX}, clientY: y + ${deltaY} }));
    element.dispatchEvent(new PointerEvent('pointerup', { ...options, clientX: x + ${deltaX}, clientY: y + ${deltaY} }));
    return true;
  })()`);
  await delay(250);
}

async function statusText(browser) {
  return browser.evaluate(`document.querySelector('[aria-label="Editor status"]')?.innerText ?? ''`);
}

async function warningText(browser) {
  return browser.evaluate(`Array.from(document.querySelectorAll('.editor-command-bar__warning')).map((item) => item.textContent ?? '').join('\\n')`);
}

function clickButton(label) {
  return `(() => {
    const button = Array.from(document.querySelectorAll('button')).find((item) => item.textContent.trim() === ${JSON.stringify(label)} && !item.disabled);
    if (button == null) throw new Error('missing enabled button: ${label}');
    button.click();
    return true;
  })()`;
}

function savedRecordIdExpression() {
  return `JSON.parse(localStorage.getItem('nerdeus.floorplans.savedAuthoringRecords.v1') || '[]')[0]?.savedPlanId ?? null`;
}

function detectMisleadingStatus(statusTextValue) {
  const failures = [];
  if (statusTextValue === "No unsaved edits") {
    failures.push("ambiguous local state text implies named-copy persistence");
  }
  return {
    status: failures.length === 0 ? "passed" : "failed",
    failures,
    statusText: statusTextValue
  };
}
