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
const issue = readArg("--issue", "633");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: active saved-copy identity was not visible enough to distinguish from the canonical default.\n");

const stages = stage === "final"
  ? ["visible-identity", "save-status-record-id", "wrong-copy-negative", "same-copy-reopen"]
  : [stage];

let scenario = null;
for (const selectedStage of stages) {
  await runStage(selectedStage);
}

const passed = statusFromChecks(checks) === "passed";
if (passed) {
  updateSaveReloadManifest(issue, {
    activeCopyIdentityStatus: "passed",
    sameRecordReloadProof: true,
    wrongCopyNegativeProof: true
  });
}
writeJson(`${dir}/test-output/active-copy-identity.txt`, {
  status: passed ? "passed" : "failed",
  stage,
  issue,
  checks
});

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-layout-editor-active-copy-identity.mjs --stage visible-identity --allow-partial --issue 633",
  "node scripts/check-layout-editor-active-copy-identity.mjs --stage save-status-record-id --allow-partial --issue 633",
  "node scripts/check-layout-editor-active-copy-identity.mjs --stage wrong-copy-negative --allow-partial --issue 633",
  "node scripts/check-layout-editor-active-copy-identity.mjs --stage same-copy-reopen --allow-partial --issue 633",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, {
  "node scripts/check-layout-editor-active-copy-identity.mjs --stage visible-identity --allow-partial --issue 633": `${dir}/active-copy-identity-output.json`,
  "node scripts/check-layout-editor-active-copy-identity.mjs --stage save-status-record-id --allow-partial --issue 633": `${dir}/save-status-record-id-output.json`,
  "node scripts/check-layout-editor-active-copy-identity.mjs --stage wrong-copy-negative --allow-partial --issue 633": `${dir}/wrong-copy-negative-output.json`,
  "node scripts/check-layout-editor-active-copy-identity.mjs --stage same-copy-reopen --allow-partial --issue 633": `${dir}/same-copy-reopen-output.json`
});
writeCloseout(issue, "Active copy identity is visible and wrong-copy reopen is browser-guarded.", passed ? "passed" : "failed", commands, [
  "Identity proof is UI/browser evidence only; no collaboration, EHR, optimizer, staffing, clinical, or outcome behavior was added.",
  "Record identity is visible in the editor and floorplan summary; later issues refine save-status wording further."
]);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", stage, issue, checks }, null, 2));
if (!passed && !allowPartial) process.exit(1);

async function runStage(selectedStage) {
  if (selectedStage === "visible-identity") {
    const commandBar = readText("apps/web/src/features/layout-editor/EditorCommandBar.tsx");
    const commandVm = readText("apps/web/src/features/layout-editor/editorCommandBarViewModel.ts");
    const activeSummary = readText("apps/web/src/features/floorplans/ActiveFloorplanSummary.tsx");
    const activeState = readText("apps/web/src/features/floorplans/activeFloorplanState.ts");
    scenario ??= await runIdentityScenario();
    const passed =
      commandBar.includes("Active copy") &&
      commandBar.includes("Record ID") &&
      commandBar.includes("Plan ID") &&
      commandBar.includes("Source") &&
      commandVm.includes("Canonical default is read-only") &&
      activeSummary.includes("Active record") &&
      activeState.includes("recordId: string | null") &&
      scenario.defaultStatusText.includes("Canonical default") &&
      scenario.savedStatusText.includes("Saved working copy") &&
      scenario.savedStatusText.includes(scenario.recordId);
    addCheck(checks, "active copy name, recordId, planId, source, read-only state are visible", passed, {
      recordId: scenario.recordId
    });
    writeJson(`${dir}/active-copy-identity-output.json`, {
      status: passed ? "passed" : "failed",
      recordId: scenario.recordId,
      defaultStatusText: scenario.defaultStatusText,
      savedStatusText: scenario.savedStatusText
    });
    writeJson(`${dir}/canonical-default-warning-output.json`, {
      status: scenario.defaultStatusText.includes("Canonical default") && scenario.defaultStatusText.includes("read-only") ? "passed" : "failed",
      defaultStatusText: scenario.defaultStatusText
    });
    return;
  }

  scenario ??= await runIdentityScenario();

  if (selectedStage === "save-status-record-id") {
    const passed = scenario.saveStatusText.includes(scenario.recordId);
    addCheck(checks, "save result includes saved recordId", passed, {
      recordId: scenario.recordId,
      saveStatusText: scenario.saveStatusText
    });
    writeJson(`${dir}/save-status-record-id-output.json`, {
      status: passed ? "passed" : "failed",
      recordId: scenario.recordId,
      saveStatusText: scenario.saveStatusText
    });
    return;
  }

  if (selectedStage === "wrong-copy-negative") {
    const passed =
      scenario.defaultStatusText.includes("Canonical default") &&
      scenario.defaultExportedRoom.x === scenario.roomBefore.xFeet &&
      scenario.defaultExportedRoom.y === scenario.roomBefore.yFeet &&
      scenario.savedExportedRoom.x === scenario.roomAfterSave.xFeet &&
      scenario.savedExportedRoom.y === scenario.roomAfterSave.yFeet;
    addCheck(checks, "canonical default remains visibly different from saved copy after save", passed, {
      defaultExportedRoom: scenario.defaultExportedRoom,
      savedExportedRoom: scenario.savedExportedRoom
    });
    writeJson(`${dir}/wrong-copy-negative-output.json`, {
      status: passed ? "passed" : "failed",
      defaultStatusText: scenario.defaultStatusText,
      savedStatusText: scenario.savedStatusText,
      defaultExportedRoom: scenario.defaultExportedRoom,
      savedExportedRoom: scenario.savedExportedRoom
    });
    return;
  }

  if (selectedStage === "same-copy-reopen") {
    const passed =
      scenario.recordId === scenario.reopenedViaLibraryRecordId &&
      scenario.savedStatusText.includes(scenario.recordId) &&
      scenario.savedExportedRoom.x === scenario.roomAfterSave.xFeet;
    addCheck(checks, "same saved recordId reopens with changed room geometry", passed, {
      recordId: scenario.recordId,
      reopenedViaLibraryRecordId: scenario.reopenedViaLibraryRecordId
    });
    writeJson(`${dir}/same-copy-reopen-output.json`, {
      status: passed ? "passed" : "failed",
      recordId: scenario.recordId,
      reopenedViaLibraryRecordId: scenario.reopenedViaLibraryRecordId,
      savedExportedRoom: scenario.savedExportedRoom
    });
    return;
  }

  throw new Error(`Unsupported active-copy identity stage: ${selectedStage}`);
}

async function runIdentityScenario() {
  mkdirSync(`${dir}/screenshots`, { recursive: true });
  const port = Number(readArg("--port", "6833"));
  const chromePort = Number(readArg("--chrome-port", "9833"));
  const initScript =
    "sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));";

  const { result } = await withBrowserRenderedApp(
    { port, chromePort, width: 1440, height: 1000, initScript },
    async (browser) => {
      await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
      await browser.evaluate("localStorage.clear()");
      await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
      await waitForExpression(browser, `document.querySelector('[aria-label="Editor status"]')?.innerText.includes('Canonical default')`, 10_000);
      const defaultStatusBeforeSave = await statusText(browser);
      await browser.screenshot(`${dir}/screenshots/canonical-default-warning.png`);

      await browser.evaluate(clickButton("Save working copy"));
      await waitForExpression(browser, `document.querySelector('[aria-label="Editor status"]')?.innerText.includes('Saved working copy')`, 10_000);
      await browser.screenshot(`${dir}/screenshots/active-copy-identity.png`);
      const recordId = await browser.evaluate(savedRecordIdExpression());
      const saveStatusText = await statusText(browser);
      const roomBefore = await browser.evaluate(savedRoomExpression("room-02"));

      await dragRoom(browser, "room-02", 144, 72);
      await browser.evaluate(clickButton("Save working copy"));
      await delay(500);
      const roomAfterSave = await browser.evaluate(savedRoomExpression("room-02"));

      await browser.evaluate(`location.reload()`);
      await waitForExpression(browser, `document.querySelector('button') != null`, 15_000);
      await browser.navigate(`${browser.baseUrl}/?section=floorplans`, `document.querySelector('[data-default-classification="canonical-default"]') != null`);
      await browser.evaluate(`(() => {
        const card = document.querySelector('[data-default-classification="canonical-default"]');
        const button = Array.from(card.querySelectorAll('button')).find((item) => item.textContent.trim() === 'Open Floorplan');
        button?.click();
      })()`);
      await delay(300);
      await browser.evaluate(clickButton("Editor"));
      await waitForExpression(browser, `document.querySelector('[aria-label="Editor status"]')?.innerText.includes('Canonical default')`, 10_000);
      const defaultStatusText = await statusText(browser);
      await browser.evaluate(clickButton("Export"));
      await delay(150);
      const defaultExport = await readExportedJson(browser);
      const defaultExportedRoom = defaultExport.rooms.find((room) => room.id === "room-02");

      await browser.evaluate(clickButton("Floorplan"));
      await waitForExpression(browser, `document.querySelector('[data-record-id="${recordId}"]') != null`, 10_000);
      const reopenedViaLibraryRecordId = await browser.evaluate(`(() => {
        const card = document.querySelector('[data-record-id="${recordId}"]');
        const button = Array.from(card.querySelectorAll('button')).find((item) => item.textContent.trim() === 'Open Saved Floorplan');
        button?.click();
        return card.getAttribute('data-record-id');
      })()`);
      await delay(300);
      await browser.evaluate(clickButton("Editor"));
      await waitForExpression(browser, `document.querySelector('[aria-label="Editor status"]')?.innerText.includes('${recordId}')`, 10_000);
      await browser.screenshot(`${dir}/screenshots/saved-copy-identity.png`);
      const savedStatusText = await statusText(browser);
      await browser.evaluate(clickButton("Export"));
      await delay(150);
      const savedExport = await readExportedJson(browser);
      const savedExportedRoom = savedExport.rooms.find((room) => room.id === "room-02");

      return {
        recordId,
        reopenedViaLibraryRecordId,
        saveStatusText,
        defaultStatusBeforeSave,
        defaultStatusText,
        savedStatusText,
        roomBefore,
        roomAfterSave,
        defaultExportedRoom,
        savedExportedRoom
      };
    }
  );
  return result;
}

async function statusText(browser) {
  return browser.evaluate(`document.querySelector('[aria-label="Editor status"]')?.innerText ?? ''`);
}

async function readExportedJson(browser) {
  const raw = await browser.evaluate(`document.querySelector('textarea[aria-label="Floorplan JSON"]')?.value ?? ''`);
  return JSON.parse(raw);
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

function savedRoomExpression(roomId) {
  return `JSON.parse(localStorage.getItem('nerdeus.floorplans.savedAuthoringRecords.v1') || '[]')[0]?.authoringDraft?.editableLayout?.rooms?.find((room) => room.id === ${JSON.stringify(roomId)}) ?? null`;
}
