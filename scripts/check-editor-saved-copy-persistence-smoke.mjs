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
  writeText,
  writeTextIfMissing
} from "./lib/editor-runtime-alignment-hardening-utils.mjs";

const issue = readArg("--issue", "657");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];
let scenario = null;

const supportedStages = [
  "saved-copy-open",
  "room-door-edit",
  "save-reload-same-copy",
  "export-json-compare",
  "final"
];

if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: editable saved copy must persist room and door edits through Save Working Copy, reload, same-copy reopen, and export.\n"
);

const stages = stage === "final"
  ? ["saved-copy-open", "room-door-edit", "save-reload-same-copy", "export-json-compare"]
  : [stage];

for (const selectedStage of stages) {
  await runStage(selectedStage);
}

const passed = statusFromChecks(checks) === "passed";
const updates = {
  savedCopyPersistenceSmokeStatus: passed ? "passed" : "failed",
  roomMovePersisted: scenario != null && roomChanged(scenario.roomBefore, scenario.roomAfterReload),
  doorChangePersisted: scenario != null && doorChanged(scenario.doorBefore, scenario.doorAfterReload),
  sameSavedRecordReloaded: scenario?.sameSavedRecordReloaded === true,
  exportJsonBackupMatched: scenario?.exportJsonBackupMatched === true
};

updateAlignmentManifest(issue, updates);
updateSavedCopyPersistenceManifest(issue, updates);

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/check-editor-saved-copy-persistence-smoke.mjs --stage saved-copy-open --allow-partial --issue ${issue}`,
  `node scripts/check-editor-saved-copy-persistence-smoke.mjs --stage room-door-edit --allow-partial --issue ${issue}`,
  `node scripts/check-editor-saved-copy-persistence-smoke.mjs --stage save-reload-same-copy --allow-partial --issue ${issue}`,
  `node scripts/check-editor-saved-copy-persistence-smoke.mjs --stage export-json-compare --allow-partial --issue ${issue}`,
  "node scripts/check-no-phi-fields.mjs"
];

writeCommands(issue, commands, {
  [`node scripts/check-editor-saved-copy-persistence-smoke.mjs --stage saved-copy-open --allow-partial --issue ${issue}`]: `${dir}/saved-copy-open-output.json`,
  [`node scripts/check-editor-saved-copy-persistence-smoke.mjs --stage room-door-edit --allow-partial --issue ${issue}`]: `${dir}/room-before-after-output.json`,
  [`node scripts/check-editor-saved-copy-persistence-smoke.mjs --stage save-reload-same-copy --allow-partial --issue ${issue}`]: `${dir}/reload-same-copy-output.json`,
  [`node scripts/check-editor-saved-copy-persistence-smoke.mjs --stage export-json-compare --allow-partial --issue ${issue}`]: `${dir}/export-json-compare-output.json`
});

writeJson(`${dir}/test-output/saved-copy-persistence-smoke.txt`, {
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
  "Editable saved-copy persistence smoke moves one room, changes one door, saves the named copy, reloads, reopens the same saved record, and compares exported JSON.",
  passed ? "passed" : "failed",
  commands,
  [
    passed
      ? "Proof uses the editable saved copy only; canonical default remains out of the persistence path."
      : "NO-GO until room and door changes survive same saved-record reload and JSON export."
  ]
);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", issue, stage, checks }, null, 2));
if (!passed && !allowPartial) process.exit(1);

async function runStage(selectedStage) {
  scenario ??= await runPersistenceScenario();
  if (selectedStage === "saved-copy-open") {
    const passedStage = scenario.savedRecordId.startsWith("saved-") &&
      scenario.activeRecordIdBeforeEdit === scenario.savedRecordId &&
      scenario.sourceBeforeEdit.includes("Saved") &&
      scenario.modeBeforeEdit === "Editable";
    addCheck(checks, "persistence smoke opened editable saved copy, not canonical default", passedStage, scenario);
    writeJson(`${dir}/saved-copy-open-output.json`, {
      status: passedStage ? "passed" : "failed",
      savedRecordId: scenario.savedRecordId,
      activeRecordIdBeforeEdit: scenario.activeRecordIdBeforeEdit,
      sourceBeforeEdit: scenario.sourceBeforeEdit,
      modeBeforeEdit: scenario.modeBeforeEdit
    });
    return;
  }
  if (selectedStage === "room-door-edit") {
    const roomPersistedToRecord = roomChanged(scenario.roomBefore, scenario.roomAfterSave);
    const doorPersistedToRecord = doorChanged(scenario.doorBefore, scenario.doorAfterSave);
    const passedStage = roomPersistedToRecord && doorPersistedToRecord;
    addCheck(checks, "room and door changed before reload and were written to saved record", passedStage, scenario);
    writeJson(`${dir}/room-before-after-output.json`, {
      status: roomPersistedToRecord ? "passed" : "failed",
      before: scenario.roomBefore,
      afterSave: scenario.roomAfterSave,
      afterReload: scenario.roomAfterReload
    });
    writeJson(`${dir}/door-before-after-output.json`, {
      status: doorPersistedToRecord ? "passed" : "failed",
      before: scenario.doorBefore,
      afterSave: scenario.doorAfterSave,
      afterReload: scenario.doorAfterReload
    });
    return;
  }
  if (selectedStage === "save-reload-same-copy") {
    const passedStage = scenario.sameSavedRecordReloaded &&
      roomChanged(scenario.roomBefore, scenario.roomAfterReload) &&
      doorChanged(scenario.doorBefore, scenario.doorAfterReload);
    addCheck(checks, "same saved record reloads with persisted room and door changes", passedStage, scenario);
    writeJson(`${dir}/save-working-copy-output.json`, {
      status: scenario.saveWorkingCopySucceeded ? "passed" : "failed",
      savedRecordId: scenario.savedRecordId,
      saveStatusText: scenario.saveStatusText
    });
    writeJson(`${dir}/reload-same-copy-output.json`, {
      status: passedStage ? "passed" : "failed",
      savedRecordId: scenario.savedRecordId,
      activeRecordIdAfterReload: scenario.activeRecordIdAfterReload,
      sameSavedRecordReloaded: scenario.sameSavedRecordReloaded,
      roomAfterReload: scenario.roomAfterReload,
      doorAfterReload: scenario.doorAfterReload
    });
    return;
  }
  if (selectedStage === "export-json-compare") {
    const passedStage = scenario.exportJsonBackupMatched;
    addCheck(checks, "Export JSON Backup after reload matches persisted room and door values", passedStage, scenario);
    writeJson(`${dir}/export-json-compare-output.json`, {
      status: passedStage ? "passed" : "failed",
      exportedJsonPath: `${dir}/exported-json/saved-copy-after-reload.json`,
      exportedRoom: scenario.exportedRoom,
      exportedDoor: scenario.exportedDoor,
      persistedRoom: scenario.roomAfterReload,
      persistedDoor: scenario.doorAfterReload
    });
    return;
  }
  throw new Error(`Unsupported saved-copy persistence stage: ${selectedStage}`);
}

async function runPersistenceScenario() {
  const port = Number(readArg("--port", "6857"));
  const chromePort = Number(readArg("--chrome-port", "9857"));
  const initScript =
    "sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));";

  const { result } = await withBrowserRenderedApp(
    { port, chromePort, width: 1440, height: 1000, initScript },
    async (browser) => {
      await browser.navigate(`${browser.baseUrl}/?section=floorplans`, `document.querySelector('[data-default-classification="canonical-default"]') != null`);
      await browser.evaluate("localStorage.clear()");
      await browser.navigate(`${browser.baseUrl}/?section=floorplans`, `document.querySelector('[data-default-classification="canonical-default"]') != null`);
      await clickCardButton(browser, `[data-default-classification="canonical-default"]`, "Edit Working Copy");
      await waitForExpression(browser, `document.querySelector('[data-default-classification="saved-copy"]') != null`, 10_000);
      const savedRecordId = await browser.evaluate(`document.querySelector('[data-default-classification="saved-copy"]')?.getAttribute('data-record-id') ?? ''`);
      await clickCardButton(browser, `[data-record-id="${savedRecordId}"]`, "Open Saved Floorplan");
      await clickButton(browser, "Editor");
      await waitForExpression(browser, `document.querySelector('[data-editor-save-status-panel="true"] [data-active-record-id]')?.getAttribute('data-active-record-id') === ${JSON.stringify(savedRecordId)}`, 10_000);
      await browser.screenshot(`${dir}/screenshots/saved-copy-before-edit.png`);

      const activeRecordIdBeforeEdit = await activeRecordId(browser);
      const sourceBeforeEdit = await fieldText(browser, "Source");
      const modeBeforeEdit = await fieldText(browser, "Mode");
      const roomBefore = await browser.evaluate(savedRoomExpression(savedRecordId, "room-02"));
      const doorBefore = await browser.evaluate(savedDoorExpression(savedRecordId, "door-02"));

      await dragRoom(browser, "room-02", 144, 72);
      await selectDoor(browser, "door-02");
      await clickQuickDoorButton(browser, "Nudge +");
      await clickQuickDoorButton(browser, "Width +");
      await browser.screenshot(`${dir}/screenshots/saved-copy-after-edit.png`);
      await clickButton(browser, "Save Working Copy");
      await waitForExpression(browser, `document.querySelector('[data-editor-save-status-panel="true"]')?.innerText.includes(${JSON.stringify(savedRecordId)})`, 10_000);
      await delay(300);
      const saveStatusText = await statusText(browser);
      const roomAfterSave = await browser.evaluate(savedRoomExpression(savedRecordId, "room-02"));
      const doorAfterSave = await browser.evaluate(savedDoorExpression(savedRecordId, "door-02"));

      await browser.evaluate("location.reload()");
      await waitForExpression(browser, `document.querySelector('button') != null`, 15_000);
      await browser.navigate(`${browser.baseUrl}/?section=floorplans`, `document.querySelector('[data-record-id="${savedRecordId}"]') != null`);
      await clickCardButton(browser, `[data-record-id="${savedRecordId}"]`, "Open Saved Floorplan");
      await clickButton(browser, "Editor");
      await waitForExpression(browser, `document.querySelector('[data-editor-save-status-panel="true"] [data-active-record-id]')?.getAttribute('data-active-record-id') === ${JSON.stringify(savedRecordId)}`, 10_000);
      await browser.screenshot(`${dir}/screenshots/saved-copy-after-reload.png`);
      const activeRecordIdAfterReload = await activeRecordId(browser);
      const roomAfterReload = await browser.evaluate(savedRoomExpression(savedRecordId, "room-02"));
      const doorAfterReload = await browser.evaluate(savedDoorExpression(savedRecordId, "door-02"));

      await clickButton(browser, "Export JSON Backup");
      await delay(150);
      const exported = await readExportedJson(browser);
      writeText(`${dir}/exported-json/saved-copy-after-reload.json`, `${JSON.stringify(exported, null, 2)}\n`);
      const exportedRoom = exported.rooms.find((room) => room.id === "room-02") ?? null;
      const exportedDoor = exported.doors.find((door) => door.id === "door-02") ?? null;

      return {
        savedRecordId,
        activeRecordIdBeforeEdit,
        sourceBeforeEdit,
        modeBeforeEdit,
        roomBefore,
        doorBefore,
        roomAfterSave,
        doorAfterSave,
        saveStatusText,
        saveWorkingCopySucceeded: saveStatusText.includes(savedRecordId) && saveStatusText.includes("Saved"),
        activeRecordIdAfterReload,
        sameSavedRecordReloaded: activeRecordIdAfterReload === savedRecordId,
        roomAfterReload,
        doorAfterReload,
        exportedRoom,
        exportedDoor,
        exportJsonBackupMatched: exportedRoomMatches(exportedRoom, roomAfterReload) &&
          exportedDoorMatches(exportedDoor, doorAfterReload)
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

async function activeRecordId(browser) {
  return browser.evaluate(`document.querySelector('[data-editor-save-status-panel="true"] [data-active-record-id]')?.getAttribute('data-active-record-id') ?? ''`);
}

async function statusText(browser) {
  return browser.evaluate(`document.querySelector('[data-editor-save-status-panel="true"]')?.innerText ?? ''`);
}

async function fieldText(browser, label) {
  return browser.evaluate(`(() => {
    const root = document.querySelector('[data-editor-save-status-panel="true"]');
    const pairs = Array.from(root?.querySelectorAll('div') ?? []);
    for (const pair of pairs) {
      const dt = pair.querySelector('dt')?.textContent?.trim();
      if (dt === ${JSON.stringify(label)}) return pair.querySelector('dd')?.textContent?.trim() ?? '';
    }
    return '';
  })()`);
}

async function readExportedJson(browser) {
  const raw = await browser.evaluate(`document.querySelector('textarea[aria-label="Floorplan JSON"]')?.value ?? ''`);
  return JSON.parse(raw);
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
