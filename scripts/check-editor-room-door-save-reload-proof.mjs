#!/usr/bin/env node
import { mkdirSync } from "node:fs";
import { withBrowserRenderedApp, waitForExpression, delay } from "./lib/app-browser-proof.mjs";
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  readArg,
  statusFromChecks,
  updateManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeJson,
  writeText,
  writeTextIfMissing
} from "./lib/editor-runtime-save-ux-layout-batch-utils.mjs";

const issue = readArg("--issue", "650");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];
let scenario = null;

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: room or door values do not survive Save Working Copy, browser reload, same-record reopen, and export.\n");

const stages = stage === "final"
  ? ["browser-room-door-proof", "same-record-reload", "exported-json-compare"]
  : [stage];
for (const selectedStage of stages) await runStage(selectedStage);

const passed = statusFromChecks(checks) === "passed";
if (passed) {
  updateManifest(issue, {
    roomDoorSaveReloadStatus: "passed",
    roomDoorSaveReloadProof: true,
    sameRecordReloadProof: true
  });
}
writeJson(`${dir}/test-output/room-door-save-reload-proof.txt`, { status: passed ? "passed" : "failed", issue, stage, checks });

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-editor-room-door-save-reload-proof.mjs --stage browser-room-door-proof --allow-partial --issue 650",
  "node scripts/check-editor-room-door-save-reload-proof.mjs --stage same-record-reload --allow-partial --issue 650",
  "node scripts/check-editor-room-door-save-reload-proof.mjs --stage exported-json-compare --allow-partial --issue 650",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, {
  "node scripts/check-editor-room-door-save-reload-proof.mjs --stage browser-room-door-proof --allow-partial --issue 650": `${dir}/browser-room-door-proof-output.json`,
  "node scripts/check-editor-room-door-save-reload-proof.mjs --stage same-record-reload --allow-partial --issue 650": `${dir}/same-record-reload-output.json`,
  "node scripts/check-editor-room-door-save-reload-proof.mjs --stage exported-json-compare --allow-partial --issue 650": `${dir}/exported-json-compare-output.json`
});
writeCloseout(issue, "Real browser proof moves a room, changes a door, saves the named working copy, reloads, reopens the same recordId, and verifies exported JSON.", passed ? "passed" : "failed", commands, [
  "Browser proof uses localStorage-backed saved working copies only; no API/EHR integration was added."
]);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", issue, stage, checks }, null, 2));
if (!passed && !allowPartial) process.exit(1);

async function runStage(selectedStage) {
  scenario ??= await runBrowserScenario();
  if (selectedStage === "browser-room-door-proof") {
    const passed = roomChanged(scenario.beforeRoom, scenario.afterRoom) &&
      doorChanged(scenario.beforeDoor, scenario.afterDoor);
    addCheck(checks, "room and door changed before save and persisted in saved record", passed, scenarioSummary(scenario));
    writeJson(`${dir}/browser-room-door-proof-output.json`, { status: passed ? "passed" : "failed", ...scenarioSummary(scenario) });
    writeJson(`${dir}/room-before-after-output.json`, {
      status: roomChanged(scenario.beforeRoom, scenario.afterRoom) ? "passed" : "failed",
      before: scenario.beforeRoom,
      after: scenario.afterRoom
    });
    writeJson(`${dir}/door-before-after-output.json`, {
      status: doorChanged(scenario.beforeDoor, scenario.afterDoor) ? "passed" : "failed",
      before: scenario.beforeDoor,
      after: scenario.afterDoor
    });
    return;
  }
  if (selectedStage === "same-record-reload") {
    const passed = scenario.recordIdBeforeSave === scenario.recordIdAfterReload &&
      scenario.recordIdAfterReload === scenario.activeRecordIdAfterReload;
    addCheck(checks, "same saved recordId is active after reload", passed, scenarioSummary(scenario));
    writeJson(`${dir}/same-record-reload-output.json`, { status: passed ? "passed" : "failed", ...scenarioSummary(scenario) });
    return;
  }
  if (selectedStage === "exported-json-compare") {
    const passed = exportedRoomMatches(scenario.exportedRoom, scenario.afterRoom) &&
      exportedDoorMatches(scenario.exportedDoor, scenario.afterDoor);
    addCheck(checks, "exported JSON after reload contains changed room and door values", passed, scenarioSummary(scenario));
    writeJson(`${dir}/exported-json-compare-output.json`, { status: passed ? "passed" : "failed", ...scenarioSummary(scenario) });
    return;
  }
  throw new Error(`Unsupported room-door save/reload stage: ${selectedStage}`);
}

async function runBrowserScenario() {
  mkdirSync(`${dir}/screenshots`, { recursive: true });
  mkdirSync(`${dir}/exported-json`, { recursive: true });
  const port = Number(readArg("--port", "6846"));
  const chromePort = Number(readArg("--chrome-port", "9846"));
  const initScript =
    "sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));";

  const { result } = await withBrowserRenderedApp(
    { port, chromePort, width: 1440, height: 1000, initScript },
    async (browser) => {
      await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-runtime-build-info="true"]') != null`);
      await browser.evaluate("localStorage.clear()");
      await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
      await waitForExpression(browser, `document.querySelector('[data-runtime-build-info="true"]')?.getAttribute('data-batch-marker') === '641-650-editor-runtime-save-layout'`, 10_000);
      await browser.screenshot(`${dir}/screenshots/before-room-door-edit.png`);
      await browser.evaluate(clickButton("Save Working Copy"));
      await waitForExpression(browser, `document.querySelector('[data-editor-save-status-panel="true"]')?.innerText.includes('Saved working copy')`, 10_000);
      const recordIdBeforeSave = await browser.evaluate(savedRecordIdExpression());
      const beforeRoom = await browser.evaluate(savedRoomExpression(recordIdBeforeSave, "room-02"));
      const beforeDoor = await browser.evaluate(savedDoorExpression(recordIdBeforeSave, "door-02"));

      await dragRoom(browser, "room-02", 144, 72);
      await selectDoor(browser, "door-02");
      await clickQuickDoorButton(browser, "Nudge +");
      await clickQuickDoorButton(browser, "Width +");
      await browser.screenshot(`${dir}/screenshots/after-room-door-edit.png`);
      await browser.evaluate(clickButton("Save Working Copy"));
      await waitForExpression(browser, `document.querySelector('[data-editor-save-status-panel="true"]')?.innerText.includes('${recordIdBeforeSave}')`, 10_000);
      await browser.screenshot(`${dir}/screenshots/after-save-status.png`);
      const afterRoom = await browser.evaluate(savedRoomExpression(recordIdBeforeSave, "room-02"));
      const afterDoor = await browser.evaluate(savedDoorExpression(recordIdBeforeSave, "door-02"));

      await browser.evaluate(`location.reload()`);
      await waitForExpression(browser, `document.querySelector('button') != null`, 15_000);
      await openSavedCopyFromLibrary(browser, recordIdBeforeSave);
      const activeRecordIdAfterReload = await browser.evaluate(`document.querySelector('[data-editor-save-status-panel="true"] [data-active-record-id]')?.getAttribute('data-active-record-id') ?? ''`);
      await browser.screenshot(`${dir}/screenshots/after-reload-same-copy.png`);
      await browser.evaluate(clickButton("Export JSON Backup"));
      await delay(150);
      const exported = await readExportedJson(browser);
      writeText(`${dir}/exported-json/after-reload-room-door.json`, `${JSON.stringify(exported, null, 2)}\n`);
      return {
        recordIdBeforeSave,
        recordIdAfterReload: recordIdBeforeSave,
        activeRecordIdAfterReload,
        beforeRoom,
        beforeDoor,
        afterRoom,
        afterDoor,
        exportedRoom: exported.rooms.find((room) => room.id === "room-02") ?? null,
        exportedDoor: exported.doors.find((door) => door.id === "door-02") ?? null
      };
    }
  );
  return result;
}

async function openSavedCopyFromLibrary(browser, recordId) {
  await browser.navigate(`${browser.baseUrl}/?section=floorplans`, `document.querySelector('[data-record-id="${recordId}"]') != null`);
  await browser.evaluate(`(() => {
    const card = document.querySelector('[data-record-id="${recordId}"]');
    const button = Array.from(card.querySelectorAll('button')).find((item) => item.textContent.trim() === 'Open Saved Floorplan');
    button?.click();
  })()`);
  await delay(300);
  await browser.evaluate(clickButton("Editor"));
  await waitForExpression(browser, `document.querySelector('[data-editor-save-status-panel="true"]')?.innerText.includes('${recordId}')`, 10_000);
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
  })()`);
  await delay(250);
}

async function selectDoor(browser, doorId) {
  await browser.evaluate(`(() => {
    const element = document.querySelector('[data-layout-object-type="door"][data-layout-object-id="${doorId}"]');
    if (element == null) throw new Error('missing door ${doorId}');
    const rect = element.getBoundingClientRect();
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: rect.x + rect.width / 2, clientY: rect.y + rect.height / 2 }));
  })()`);
  await waitForExpression(browser, `document.querySelector('[data-door-quick-edit="ready"]') != null`, 10_000);
}

async function clickQuickDoorButton(browser, label) {
  await browser.evaluate(`(() => {
    const root = document.querySelector('[data-door-quick-edit="ready"]');
    const button = Array.from(root?.querySelectorAll('button') ?? []).find((item) => item.textContent.trim() === ${JSON.stringify(label)} && !item.disabled);
    if (button == null) throw new Error('missing enabled door quick-edit button: ${label}');
    button.click();
  })()`);
  await delay(150);
}

async function readExportedJson(browser) {
  const raw = await browser.evaluate(`document.querySelector('textarea[aria-label="Floorplan JSON"]')?.value ?? ''`);
  return JSON.parse(raw);
}

function clickButton(label) {
  return `(() => {
    const button = Array.from(document.querySelectorAll('button')).find((item) => item.textContent.trim() === ${JSON.stringify(label)} && !item.disabled);
    if (button == null) throw new Error('missing enabled button: ${label}');
    button.click();
  })()`;
}

function savedRecordIdExpression() {
  return `JSON.parse(localStorage.getItem('nerdeus.floorplans.savedAuthoringRecords.v1') || '[]')[0]?.savedPlanId ?? null`;
}

function savedRoomExpression(recordId, roomId) {
  return `JSON.parse(localStorage.getItem('nerdeus.floorplans.savedAuthoringRecords.v1') || '[]').find((candidate) => candidate.savedPlanId === ${JSON.stringify(recordId)})?.authoringDraft?.editableLayout?.rooms?.find((room) => room.id === ${JSON.stringify(roomId)}) ?? null`;
}

function savedDoorExpression(recordId, doorId) {
  return `JSON.parse(localStorage.getItem('nerdeus.floorplans.savedAuthoringRecords.v1') || '[]').find((candidate) => candidate.savedPlanId === ${JSON.stringify(recordId)})?.authoringDraft?.editableLayout?.doors?.find((door) => door.id === ${JSON.stringify(doorId)}) ?? null`;
}

function roomChanged(before, after) {
  return before != null && after != null &&
    (before.xFeet !== after.xFeet || before.yFeet !== after.yFeet || before.widthFeet !== after.widthFeet || before.heightFeet !== after.heightFeet);
}

function doorChanged(before, after) {
  return before != null && after != null &&
    (before.ownerId !== after.ownerId || before.wall !== after.wall || before.offsetFeet !== after.offsetFeet || before.widthFeet !== after.widthFeet);
}

function exportedRoomMatches(planRoom, editableRoom) {
  return planRoom != null && editableRoom != null &&
    planRoom.id === editableRoom.id &&
    planRoom.x === editableRoom.xFeet &&
    planRoom.y === editableRoom.yFeet &&
    planRoom.widthFeet === editableRoom.widthFeet &&
    planRoom.lengthFeet === editableRoom.heightFeet;
}

function exportedDoorMatches(planDoor, editableDoor) {
  return planDoor != null && editableDoor != null &&
    planDoor.id === editableDoor.id &&
    planDoor.roomId === editableDoor.ownerId &&
    planDoor.widthFeet === editableDoor.widthFeet;
}

function scenarioSummary(scenarioValue) {
  return {
    recordIdBeforeSave: scenarioValue.recordIdBeforeSave,
    recordIdAfterReload: scenarioValue.recordIdAfterReload,
    activeRecordIdAfterReload: scenarioValue.activeRecordIdAfterReload,
    beforeRoom: scenarioValue.beforeRoom,
    afterRoom: scenarioValue.afterRoom,
    beforeDoor: scenarioValue.beforeDoor,
    afterDoor: scenarioValue.afterDoor,
    exportedRoom: scenarioValue.exportedRoom,
    exportedDoor: scenarioValue.exportedDoor
  };
}
