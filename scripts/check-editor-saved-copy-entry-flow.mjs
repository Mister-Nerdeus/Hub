#!/usr/bin/env node
import { withBrowserRenderedApp, waitForExpression, delay } from "./lib/app-browser-proof.mjs";
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  readArg,
  statusFromChecks,
  updateAlignmentManifest,
  updateSavedCopyPersistenceManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeJson,
  writeTextIfMissing
} from "./lib/editor-runtime-alignment-hardening-utils.mjs";

const issue = readArg("--issue", "656");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];
let scenario = null;

const supportedStages = [
  "canonical-readonly",
  "editable-copy-discovery",
  "open-saved-copy",
  "editor-editable-mode",
  "final"
];

if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: saved-copy entry proof must open the editable saved copy, not the canonical default.\n"
);

const stages = stage === "final"
  ? ["canonical-readonly", "editable-copy-discovery", "open-saved-copy", "editor-editable-mode"]
  : [stage];

for (const selectedStage of stages) {
  await runStage(selectedStage);
}

const passed = statusFromChecks(checks) === "passed";
const updates = {
  editableSavedCopyEntryStatus: passed ? "passed" : "failed",
  canonicalDefaultReadOnlyProof: scenario?.canonicalDefaultReadOnly === true,
  editableSavedCopyOpened: scenario?.editableSavedCopyOpened === true,
  editableSavedCopyRecordIdCaptured: typeof scenario?.savedRecordId === "string" && scenario.savedRecordId.startsWith("saved-"),
  saveWorkingCopyEnabledForSavedCopy: scenario?.saveWorkingCopyEnabled === true
};

updateAlignmentManifest(issue, updates);
updateSavedCopyPersistenceManifest(issue, updates);

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/check-editor-saved-copy-entry-flow.mjs --stage canonical-readonly --allow-partial --issue ${issue}`,
  `node scripts/check-editor-saved-copy-entry-flow.mjs --stage editable-copy-discovery --allow-partial --issue ${issue}`,
  `node scripts/check-editor-saved-copy-entry-flow.mjs --stage open-saved-copy --allow-partial --issue ${issue}`,
  `node scripts/check-editor-saved-copy-entry-flow.mjs --stage editor-editable-mode --allow-partial --issue ${issue}`,
  "node scripts/check-no-phi-fields.mjs"
];

writeCommands(issue, commands, {
  [`node scripts/check-editor-saved-copy-entry-flow.mjs --stage canonical-readonly --allow-partial --issue ${issue}`]: `${dir}/canonical-readonly-output.json`,
  [`node scripts/check-editor-saved-copy-entry-flow.mjs --stage editable-copy-discovery --allow-partial --issue ${issue}`]: `${dir}/editable-copy-discovery-output.json`,
  [`node scripts/check-editor-saved-copy-entry-flow.mjs --stage open-saved-copy --allow-partial --issue ${issue}`]: `${dir}/open-saved-copy-output.json`,
  [`node scripts/check-editor-saved-copy-entry-flow.mjs --stage editor-editable-mode --allow-partial --issue ${issue}`]: `${dir}/editor-editable-mode-output.json`
});

writeJson(`${dir}/test-output/saved-copy-entry-flow.txt`, {
  status: passed ? "passed" : "failed",
  issue,
  stage,
  checks
});
writeJson(`${dir}/test-output/shared.txt`, { status: "not-run", issue, stage, reason: "acceptance command evidence slot." });
writeJson(`${dir}/test-output/web.txt`, { status: "not-run", issue, stage, reason: "acceptance command evidence slot." });
writeJson(`${dir}/test-output/web-build.txt`, { status: "not-run", issue, stage, reason: "acceptance command evidence slot." });

writeCloseout(
  issue,
  "Editable saved-copy entry proof opens a saved working copy, verifies editable mode, and verifies the canonical default remains read-only.",
  passed ? "passed" : "failed",
  commands,
  [
    passed
      ? "Saved-copy entry proof is limited to local browser storage and fresh local runtime evidence."
      : "NO-GO until the saved copy can be opened in editable mode with a captured saved record ID."
  ]
);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", issue, stage, checks }, null, 2));
if (!passed && !allowPartial) process.exit(1);

async function runStage(selectedStage) {
  scenario ??= await runEntryScenario();
  if (selectedStage === "canonical-readonly") {
    const passedStage = scenario.canonicalDefaultReadOnly && scenario.canonicalRecordId !== scenario.savedRecordId;
    addCheck(checks, "canonical default remains read-only and distinct from saved copy", passedStage, scenario);
    writeJson(`${dir}/canonical-readonly-output.json`, {
      status: passedStage ? "passed" : "failed",
      canonicalRecordId: scenario.canonicalRecordId,
      canonicalStatusText: scenario.canonicalStatusText,
      canonicalModeLabel: scenario.canonicalModeLabel,
      savedRecordId: scenario.savedRecordId
    });
    return;
  }
  if (selectedStage === "editable-copy-discovery") {
    const passedStage = scenario.savedCardDiscovered && scenario.savedRecordId.startsWith("saved-");
    addCheck(checks, "editable saved copy is discoverable in floorplan library", passedStage, scenario);
    writeJson(`${dir}/editable-copy-discovery-output.json`, {
      status: passedStage ? "passed" : "failed",
      savedRecordId: scenario.savedRecordId,
      savedCardName: scenario.savedCardName,
      savedCardReadOnlyLabel: scenario.savedCardReadOnlyLabel
    });
    return;
  }
  if (selectedStage === "open-saved-copy") {
    const passedStage = scenario.editableSavedCopyOpened && scenario.activeRecordId === scenario.savedRecordId;
    addCheck(checks, "Open Saved Floorplan activates the same saved record ID", passedStage, scenario);
    writeJson(`${dir}/open-saved-copy-output.json`, {
      status: passedStage ? "passed" : "failed",
      savedRecordId: scenario.savedRecordId,
      activeRecordId: scenario.activeRecordId,
      activeSourceText: scenario.activeSourceText
    });
    return;
  }
  if (selectedStage === "editor-editable-mode") {
    const passedStage = scenario.editorModeEditable && scenario.saveWorkingCopyEnabled && scenario.addObjectEnabled;
    addCheck(checks, "editor opens saved copy in editable mode with Save Working Copy enabled", passedStage, scenario);
    writeJson(`${dir}/editor-editable-mode-output.json`, {
      status: passedStage ? "passed" : "failed",
      modeLabel: scenario.modeLabel,
      saveWorkingCopyEnabled: scenario.saveWorkingCopyEnabled,
      addObjectEnabled: scenario.addObjectEnabled
    });
    writeJson(`${dir}/save-working-copy-enabled-output.json`, {
      status: scenario.saveWorkingCopyEnabled ? "passed" : "failed",
      savedRecordId: scenario.savedRecordId
    });
    return;
  }
  throw new Error(`Unsupported saved-copy entry stage: ${selectedStage}`);
}

async function runEntryScenario() {
  const port = Number(readArg("--port", "6856"));
  const chromePort = Number(readArg("--chrome-port", "9856"));
  const initScript =
    "sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));";

  const { result } = await withBrowserRenderedApp(
    { port, chromePort, width: 1440, height: 1000, initScript },
    async (browser) => {
      await browser.navigate(`${browser.baseUrl}/?section=floorplans`, `document.querySelector('[data-default-classification="canonical-default"]') != null`);
      await browser.evaluate("localStorage.clear()");
      await browser.navigate(`${browser.baseUrl}/?section=floorplans`, `document.querySelector('[data-default-classification="canonical-default"]') != null`);

      const canonicalRecordId = await browser.evaluate(`document.querySelector('[data-default-classification="canonical-default"]')?.getAttribute('data-record-id') ?? ''`);
      await clickCardButton(browser, `[data-default-classification="canonical-default"]`, "Open Floorplan");
      await clickButton(browser, "Editor");
      await waitForExpression(browser, `document.querySelector('[data-editor-save-status-panel="true"]')?.innerText.includes('Read-only')`, 10_000);
      await browser.screenshot(`${dir}/screenshots/canonical-readonly-proof.png`);
      const canonicalStatusText = await statusText(browser);
      const canonicalModeLabel = await fieldText(browser, "Mode");
      const canonicalDefaultReadOnly = canonicalStatusText.includes("Canonical default") &&
        canonicalStatusText.includes("Read-only");

      await browser.navigate(`${browser.baseUrl}/?section=floorplans`, `document.querySelector('[data-default-classification="canonical-default"]') != null`);
      await clickCardButton(browser, `[data-default-classification="canonical-default"]`, "Edit Working Copy");
      await waitForExpression(browser, `document.querySelector('[data-default-classification="saved-copy"]') != null`, 10_000);
      await browser.screenshot(`${dir}/screenshots/floorplan-saved-copy-card.png`);
      const savedRecordId = await browser.evaluate(`document.querySelector('[data-default-classification="saved-copy"]')?.getAttribute('data-record-id') ?? ''`);
      const savedCardName = await browser.evaluate(`document.querySelector('[data-default-classification="saved-copy"] h3')?.textContent?.trim() ?? ''`);
      const savedCardReadOnlyLabel = await browser.evaluate(`document.querySelector('[data-default-classification="saved-copy"] .floorplan-library__card-header span')?.textContent?.trim() ?? ''`);
      const savedCardDiscovered = savedRecordId.startsWith("saved-") && savedCardReadOnlyLabel.includes("Editable");

      await clickCardButton(browser, `[data-record-id="${savedRecordId}"]`, "Open Saved Floorplan");
      await clickButton(browser, "Editor");
      await waitForExpression(browser, `document.querySelector('[data-editor-save-status-panel="true"] [data-active-record-id]')?.getAttribute('data-active-record-id') === ${JSON.stringify(savedRecordId)}`, 10_000);
      await browser.screenshot(`${dir}/screenshots/editor-opened-saved-copy.png`);
      const activeRecordId = await activeRecordIdText(browser);
      const activeSourceText = await fieldText(browser, "Source");
      const modeLabel = await fieldText(browser, "Mode");
      const saveWorkingCopyEnabled = await enabledButton(browser, "Save Working Copy");
      const addObjectEnabled = await enabledButton(browser, "Add Object");

      return {
        canonicalRecordId,
        canonicalStatusText,
        canonicalModeLabel,
        canonicalDefaultReadOnly,
        savedRecordId,
        savedCardName,
        savedCardReadOnlyLabel,
        savedCardDiscovered,
        editableSavedCopyOpened: activeRecordId === savedRecordId,
        activeRecordId,
        activeSourceText,
        modeLabel,
        editorModeEditable: modeLabel === "Editable" && activeSourceText.includes("Saved"),
        saveWorkingCopyEnabled,
        addObjectEnabled
      };
    }
  );
  return result;
}

async function clickButton(browser, label) {
  await browser.evaluate(buttonExpression(label));
  await delay(250);
}

async function clickCardButton(browser, selector, label) {
  await browser.evaluate(`(() => {
    const card = document.querySelector(${JSON.stringify(selector)});
    if (card == null) throw new Error('missing card: ${selector}');
    const button = Array.from(card.querySelectorAll('button')).find((item) => item.textContent.trim() === ${JSON.stringify(label)} && !item.disabled);
    if (button == null) throw new Error('missing enabled card button: ${label}');
    button.click();
  })()`);
  await delay(300);
}

function buttonExpression(label) {
  return `(() => {
    const button = Array.from(document.querySelectorAll('button')).find((item) => item.textContent.trim() === ${JSON.stringify(label)} && !item.disabled);
    if (button == null) throw new Error('missing enabled button: ${label}');
    button.click();
  })()`;
}

async function statusText(browser) {
  return browser.evaluate(`document.querySelector('[data-editor-save-status-panel="true"]')?.innerText ?? document.querySelector('[aria-label="Editor status"]')?.innerText ?? ''`);
}

async function fieldText(browser, label) {
  return browser.evaluate(`(() => {
    const roots = Array.from(document.querySelectorAll('[data-editor-save-status-panel="true"], [aria-label="Editor status"]'));
    for (const root of roots) {
      const pairs = Array.from(root.querySelectorAll('div'));
      for (const pair of pairs) {
        const dt = pair.querySelector('dt')?.textContent?.trim();
        if (dt === ${JSON.stringify(label)}) return pair.querySelector('dd')?.textContent?.trim() ?? '';
      }
    }
    return '';
  })()`);
}

async function activeRecordIdText(browser) {
  return browser.evaluate(`document.querySelector('[data-editor-save-status-panel="true"] [data-active-record-id]')?.getAttribute('data-active-record-id') ?? ''`);
}

async function enabledButton(browser, label) {
  return browser.evaluate(`Array.from(document.querySelectorAll('button')).some((item) => item.textContent.trim() === ${JSON.stringify(label)} && !item.disabled)`);
}
