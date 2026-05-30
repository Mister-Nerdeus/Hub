#!/usr/bin/env node
import { mkdirSync } from "node:fs";
import { withBrowserRenderedApp, waitForExpression, delay } from "./lib/app-browser-proof.mjs";
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  readArg,
  statusFromChecks,
  updateSaveReloadManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeJson,
  writeText,
  writeTextIfMissing
} from "./lib/floorplan-editor-save-reload-batch-utils.mjs";

const stage = readArg("--stage", "final");
const issue = readArg("--issue", "635");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];
const hasDirtyNamedCopyStatus = (text) =>
  text.includes("Not saved since local changes") ||
  text.includes("Draft changed");

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: moved room geometry does not yet have same-record save/reload proof.\n"
);

const stages = stage === "final"
  ? ["immediate-edit", "save-reload", "export-after-reload", "default-not-mutated", "stale-room-negative"]
  : [stage];

let scenario = null;
for (const selectedStage of stages) {
  await runStage(selectedStage);
}

const passed = statusFromChecks(checks) === "passed";
if (passed) {
  updateSaveReloadManifest(issue, {
    roomMovePersistenceStatus: "passed",
    roomMoveReloadProof: true
  });
}

writeJson(`${dir}/test-output/room-move-persistence.txt`, {
  status: passed ? "passed" : "failed",
  stage,
  issue,
  checks
});

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-layout-editor-room-move-persistence.mjs --stage immediate-edit --allow-partial --issue 635",
  "node scripts/check-layout-editor-room-move-persistence.mjs --stage save-reload --allow-partial --issue 635",
  "node scripts/check-layout-editor-room-move-persistence.mjs --stage export-after-reload --allow-partial --issue 635",
  "node scripts/check-layout-editor-room-move-persistence.mjs --stage default-not-mutated --allow-partial --issue 635",
  "node scripts/check-layout-editor-room-move-persistence.mjs --stage stale-room-negative --allow-partial --issue 635",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, {
  "node scripts/check-layout-editor-room-move-persistence.mjs --stage immediate-edit --allow-partial --issue 635": `${dir}/immediate-editable-layout-output.json`,
  "node scripts/check-layout-editor-room-move-persistence.mjs --stage save-reload --allow-partial --issue 635": `${dir}/reload-room-output.json`,
  "node scripts/check-layout-editor-room-move-persistence.mjs --stage export-after-reload --allow-partial --issue 635": `${dir}/export-room-output.json`,
  "node scripts/check-layout-editor-room-move-persistence.mjs --stage default-not-mutated --allow-partial --issue 635": `${dir}/default-not-mutated-output.json`,
  "node scripts/check-layout-editor-room-move-persistence.mjs --stage stale-room-negative --allow-partial --issue 635": `${dir}/stale-room-negative-output.json`
});
writeCloseout(issue, "Room move persistence survives real editor edit, undo/redo, named-copy save, browser reload, same-copy reopen, and export.", passed ? "passed" : "failed", commands, [
  "This issue proves room movement only; door persistence is handled by Issue 636.",
  "The UI still contains legacy save-state wording that is intentionally corrected in Issue 638."
]);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", stage, issue, checks }, null, 2));
if (!passed && !allowPartial) process.exit(1);

async function runStage(selectedStage) {
  if (selectedStage === "stale-room-negative") {
    const negative = detectStaleRoom({
      expected: { id: "room-02", x: 56, y: 34, widthFeet: 10, lengthFeet: 10 },
      afterReload: { id: "room-02", x: 44, y: 28, widthFeet: 10, lengthFeet: 10 }
    });
    const passed = negative.status === "failed" &&
      negative.failures.includes("room x/y reverted after reload");
    addCheck(checks, "stale room payload negative fixture is detected", passed, negative);
    writeJson(`${dir}/stale-room-negative-output.json`, {
      status: passed ? "passed" : "failed",
      detectedFailure: negative
    });
    return;
  }

  scenario ??= await runRoomMoveScenario();

  if (selectedStage === "immediate-edit") {
    const passed =
      roomPlanMatches(scenario.immediateExportedRoom, scenario.roomExpected) &&
      hasDirtyNamedCopyStatus(scenario.dirtyStatusText) &&
      roomPlanMatches(scenario.roomAfterUndo, scenario.roomBefore) &&
      roomPlanMatches(scenario.roomAfterRedo, scenario.roomExpected);
    addCheck(checks, "room move updates editor state, marks dirty, and remains undoable/redoable before save", passed, {
      roomBefore: scenario.roomBefore,
      immediateExportedRoom: scenario.immediateExportedRoom,
      roomAfterUndo: scenario.roomAfterUndo,
      roomAfterRedo: scenario.roomAfterRedo,
      dirtyStatusText: scenario.dirtyStatusText
    });
    writeJson(`${dir}/immediate-editable-layout-output.json`, {
      status: passed ? "passed" : "failed",
      roomBefore: scenario.roomBefore,
      roomExpected: scenario.roomExpected,
      immediateExportedRoom: scenario.immediateExportedRoom,
      roomAfterUndo: scenario.roomAfterUndo,
      roomAfterRedo: scenario.roomAfterRedo
    });
    writeJson(`${dir}/dirty-state-output.json`, {
      status: hasDirtyNamedCopyStatus(scenario.dirtyStatusText) ? "passed" : "failed",
      dirtyStatusText: scenario.dirtyStatusText
    });
    return;
  }

  if (selectedStage === "save-reload") {
    const passed =
      scenario.recordIdBeforeSave === scenario.recordIdAfterReload &&
      roomEditableMatchesPlan(scenario.savedRecordRoom, scenario.roomExpected) &&
      roomEditableMatchesPlan(scenario.reloadedEditableRoom, scenario.roomExpected);
    addCheck(checks, "saved room geometry survives browser reload and same-copy reopen", passed, {
      recordIdBeforeSave: scenario.recordIdBeforeSave,
      recordIdAfterReload: scenario.recordIdAfterReload,
      savedRecordRoom: scenario.savedRecordRoom,
      reloadedEditableRoom: scenario.reloadedEditableRoom
    });
    writeJson(`${dir}/saved-record-room-output.json`, {
      status: roomEditableMatchesPlan(scenario.savedRecordRoom, scenario.roomExpected) ? "passed" : "failed",
      recordId: scenario.recordIdBeforeSave,
      savedRecordRoom: scenario.savedRecordRoom,
      roomExpected: scenario.roomExpected
    });
    writeJson(`${dir}/reload-room-output.json`, {
      status: passed ? "passed" : "failed",
      recordIdBeforeSave: scenario.recordIdBeforeSave,
      recordIdAfterReload: scenario.recordIdAfterReload,
      reloadedEditableRoom: scenario.reloadedEditableRoom,
      roomExpected: scenario.roomExpected
    });
    return;
  }

  if (selectedStage === "export-after-reload") {
    const passed = roomPlanMatches(scenario.exportedRoomAfterReload, scenario.roomExpected);
    addCheck(checks, "exported JSON after reload contains moved room x/y", passed, {
      exportedRoomAfterReload: scenario.exportedRoomAfterReload,
      roomExpected: scenario.roomExpected
    });
    writeJson(`${dir}/export-room-output.json`, {
      status: passed ? "passed" : "failed",
      exportedRoomAfterReload: scenario.exportedRoomAfterReload,
      roomExpected: scenario.roomExpected,
      exportedJsonPath: `${dir}/exported-json/room-after-reload.json`
    });
    return;
  }

  if (selectedStage === "default-not-mutated") {
    const passed = roomPlanMatches(scenario.defaultExportedRoom, scenario.roomBefore);
    addCheck(checks, "canonical default remains unchanged after saved-copy room move", passed, {
      defaultExportedRoom: scenario.defaultExportedRoom,
      roomBefore: scenario.roomBefore
    });
    writeJson(`${dir}/default-not-mutated-output.json`, {
      status: passed ? "passed" : "failed",
      defaultExportedRoom: scenario.defaultExportedRoom,
      originalRoom: scenario.roomBefore
    });
    return;
  }

  throw new Error(`Unsupported room-move persistence stage: ${selectedStage}`);
}

async function runRoomMoveScenario() {
  mkdirSync(`${dir}/screenshots`, { recursive: true });
  mkdirSync(`${dir}/exported-json`, { recursive: true });
  const port = Number(readArg("--port", "6835"));
  const chromePort = Number(readArg("--chrome-port", "9835"));
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
      await browser.screenshot(`${dir}/screenshots/room-before-move.png`);

      const recordIdBeforeSave = await browser.evaluate(savedRecordIdExpression());
      const roomBeforeEditable = await browser.evaluate(savedRoomExpression(recordIdBeforeSave, "room-02"));
      const roomBefore = editableRoomToPlanRoom(roomBeforeEditable);

      await dragRoom(browser, "room-02", 144, 72);
      await delay(150);
      await browser.screenshot(`${dir}/screenshots/room-after-move.png`);
      const dirtyStatusText = await statusText(browser);
      await browser.evaluate(clickButton("Export"));
      await delay(150);
      const immediateExport = await readExportedJson(browser);
      const immediateExportedRoom = immediateExport.rooms.find((room) => room.id === "room-02");
      const roomExpected = {
        ...roomBefore,
        x: roomBefore.x + 12,
        y: roomBefore.y + 6
      };

      await browser.evaluate(clickButton("Undo"));
      await delay(150);
      await browser.evaluate(clickButton("Export"));
      await delay(150);
      const undoExport = await readExportedJson(browser);
      const roomAfterUndo = undoExport.rooms.find((room) => room.id === "room-02");

      await browser.evaluate(clickButton("Redo"));
      await delay(150);
      await browser.evaluate(clickButton("Export"));
      await delay(150);
      const redoExport = await readExportedJson(browser);
      const roomAfterRedo = redoExport.rooms.find((room) => room.id === "room-02");

      await browser.evaluate(clickButton("Save working copy"));
      await delay(500);
      const savedRecordRoom = await browser.evaluate(savedRoomExpression(recordIdBeforeSave, "room-02"));

      await browser.evaluate(`location.reload()`);
      await waitForExpression(browser, `document.querySelector('button') != null`, 15_000);
      await browser.navigate(`${browser.baseUrl}/?section=floorplans`, `document.querySelector('[data-record-id="${recordIdBeforeSave}"]') != null`);
      const recordIdAfterReload = await browser.evaluate(`(() => {
        const card = document.querySelector('[data-record-id="${recordIdBeforeSave}"]');
        const button = Array.from(card.querySelectorAll('button')).find((item) => item.textContent.trim() === 'Open Saved Floorplan');
        button?.click();
        return card.getAttribute('data-record-id');
      })()`);
      await delay(300);
      await browser.evaluate(clickButton("Editor"));
      await waitForExpression(browser, `document.querySelector('[aria-label="Editor status"]')?.innerText.includes('${recordIdBeforeSave}')`, 10_000);
      await browser.screenshot(`${dir}/screenshots/room-after-reload.png`);
      const reloadedEditableRoom = await browser.evaluate(savedRoomExpression(recordIdBeforeSave, "room-02"));
      await browser.evaluate(clickButton("Export"));
      await delay(150);
      const afterReloadExport = await readExportedJson(browser);
      writeText(`${dir}/exported-json/room-after-reload.json`, `${JSON.stringify(afterReloadExport, null, 2)}\n`);
      const exportedRoomAfterReload = afterReloadExport.rooms.find((room) => room.id === "room-02");

      await browser.evaluate(clickButton("Floorplan"));
      await waitForExpression(browser, `document.querySelector('[data-default-classification="canonical-default"]') != null`, 10_000);
      await browser.evaluate(`(() => {
        const card = document.querySelector('[data-default-classification="canonical-default"]');
        const button = Array.from(card.querySelectorAll('button')).find((item) => item.textContent.trim() === 'Open Floorplan');
        button?.click();
      })()`);
      await delay(300);
      await browser.evaluate(clickButton("Editor"));
      await waitForExpression(browser, `document.querySelector('[aria-label="Editor status"]')?.innerText.includes('Canonical default')`, 10_000);
      await browser.evaluate(clickButton("Export"));
      await delay(150);
      const defaultExport = await readExportedJson(browser);
      const defaultExportedRoom = defaultExport.rooms.find((room) => room.id === "room-02");

      return {
        recordIdBeforeSave,
        recordIdAfterReload,
        roomBefore,
        roomExpected,
        immediateExportedRoom,
        roomAfterUndo,
        roomAfterRedo,
        dirtyStatusText,
        savedRecordRoom,
        reloadedEditableRoom,
        exportedRoomAfterReload,
        defaultExportedRoom
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

async function readExportedJson(browser) {
  const raw = await browser.evaluate(`document.querySelector('textarea[aria-label="Floorplan JSON"]')?.value ?? ''`);
  return JSON.parse(raw);
}

async function statusText(browser) {
  return browser.evaluate(`document.querySelector('[aria-label="Editor status"]')?.innerText ?? ''`);
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

function savedRoomExpression(recordId, roomId) {
  return `(() => {
    const record = JSON.parse(localStorage.getItem('nerdeus.floorplans.savedAuthoringRecords.v1') || '[]').find((candidate) => candidate.savedPlanId === ${JSON.stringify(recordId)});
    return record?.authoringDraft?.editableLayout?.rooms?.find((room) => room.id === ${JSON.stringify(roomId)}) ?? null;
  })()`;
}

function editableRoomToPlanRoom(room) {
  return {
    id: room.id,
    x: room.xFeet,
    y: room.yFeet,
    widthFeet: room.widthFeet,
    lengthFeet: room.heightFeet
  };
}

function roomPlanMatches(left, right) {
  return left != null && right != null &&
    left.id === right.id &&
    left.x === right.x &&
    left.y === right.y &&
    left.widthFeet === right.widthFeet &&
    left.lengthFeet === right.lengthFeet;
}

function roomEditableMatchesPlan(editableRoom, planRoom) {
  return editableRoom != null && planRoom != null &&
    editableRoom.id === planRoom.id &&
    editableRoom.xFeet === planRoom.x &&
    editableRoom.yFeet === planRoom.y &&
    editableRoom.widthFeet === planRoom.widthFeet &&
    editableRoom.heightFeet === planRoom.lengthFeet;
}

function detectStaleRoom({ expected, afterReload }) {
  const failures = [];
  if (!roomPlanMatches(afterReload, expected)) {
    failures.push("room x/y reverted after reload");
  }
  return {
    status: failures.length === 0 ? "passed" : "failed",
    failures,
    expected,
    afterReload
  };
}
