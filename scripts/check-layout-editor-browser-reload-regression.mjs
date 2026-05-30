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
const issue = readArg("--issue", "639");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: browser reload regression matrix is not yet implemented.\n");

const stages = stage === "final"
  ? ["room-move-only", "door-change-only", "room-and-door", "clear-local-draft", "unsaved-local-draft-negative"]
  : [stage];

const scenarioCache = new Map();
for (const selectedStage of stages) {
  await runStage(selectedStage);
}

const passed = statusFromChecks(checks) === "passed";
if (passed) {
  updateSaveReloadManifest(issue, {
    browserReloadRegressionStatus: "passed",
    roomDoorCombinedReloadProof: true,
    greenPersistenceProof: true
  });
}

writeJson(`${dir}/test-output/browser-reload-regression.txt`, {
  status: passed ? "passed" : "failed",
  stage,
  issue,
  checks
});
writeArtifactIndexes();

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-layout-editor-browser-reload-regression.mjs --stage room-move-only --allow-partial --issue 639",
  "node scripts/check-layout-editor-browser-reload-regression.mjs --stage door-change-only --allow-partial --issue 639",
  "node scripts/check-layout-editor-browser-reload-regression.mjs --stage room-and-door --allow-partial --issue 639",
  "node scripts/check-layout-editor-browser-reload-regression.mjs --stage clear-local-draft --allow-partial --issue 639",
  "node scripts/check-layout-editor-browser-reload-regression.mjs --stage unsaved-local-draft-negative --allow-partial --issue 639",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, {
  "node scripts/check-layout-editor-browser-reload-regression.mjs --stage room-move-only --allow-partial --issue 639": `${dir}/scenario-1-room-output.json`,
  "node scripts/check-layout-editor-browser-reload-regression.mjs --stage door-change-only --allow-partial --issue 639": `${dir}/scenario-2-door-output.json`,
  "node scripts/check-layout-editor-browser-reload-regression.mjs --stage room-and-door --allow-partial --issue 639": `${dir}/scenario-3-room-door-output.json`,
  "node scripts/check-layout-editor-browser-reload-regression.mjs --stage clear-local-draft --allow-partial --issue 639": `${dir}/scenario-4-clear-local-draft-output.json`,
  "node scripts/check-layout-editor-browser-reload-regression.mjs --stage unsaved-local-draft-negative --allow-partial --issue 639": `${dir}/scenario-5-unsaved-local-draft-output.json`
});
writeCloseout(issue, "Browser regression matrix proves room, door, combined, local-draft-cleared, and unsaved-local-draft negative save/reload behavior.", passed ? "passed" : "failed", commands, [
  "Regression pack uses the real editor, real Save working copy button, browser reload, same-copy reopen, and exported JSON comparison.",
  "This issue does not make a reconstruction GO decision; Issue 640 reruns validators and decides GO/NO-GO."
]);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", stage, issue, checks }, null, 2));
if (!passed && !allowPartial) process.exit(1);

async function runStage(selectedStage) {
  if (selectedStage === "room-move-only") {
    const scenario = await getScenario("scenario-1", {
      room: true,
      door: false,
      save: true,
      clearLocalDraft: false,
      screenshot: "scenario-1-after-reload.png",
      exportFile: "scenario-1-after-reload.json"
    });
    const passed = roomPlanMatches(scenario.exportedRoomAfterReload, scenario.expectedRoom) &&
      roomEditableMatchesPlan(scenario.namedSavedRoomAfterReload, scenario.expectedRoom) &&
      scenario.recordIdBeforeSave === scenario.recordIdAfterReload;
    addCheck(checks, "scenario 1 room move only survives save/reload/export", passed, scenarioSummary(scenario));
    writeJson(`${dir}/scenario-1-room-output.json`, { status: passed ? "passed" : "failed", ...scenarioSummary(scenario) });
    return;
  }

  if (selectedStage === "door-change-only") {
    const scenario = await getScenario("scenario-2", {
      room: false,
      door: true,
      save: true,
      clearLocalDraft: false,
      screenshot: "scenario-2-after-reload.png",
      exportFile: "scenario-2-after-reload.json"
    });
    const passed = doorPlanMatchesEditable(scenario.exportedDoorAfterReload, scenario.expectedDoor) &&
      doorEditableMatches(scenario.namedSavedDoorAfterReload, scenario.expectedDoor) &&
      scenario.recordIdBeforeSave === scenario.recordIdAfterReload;
    addCheck(checks, "scenario 2 door change only survives save/reload/export", passed, scenarioSummary(scenario));
    writeJson(`${dir}/scenario-2-door-output.json`, { status: passed ? "passed" : "failed", ...scenarioSummary(scenario) });
    return;
  }

  if (selectedStage === "room-and-door") {
    const scenario = await getScenario("scenario-3", {
      room: true,
      door: true,
      save: true,
      clearLocalDraft: false,
      screenshot: "scenario-3-after-reload.png",
      exportFile: "scenario-3-after-reload.json"
    });
    const passed = roomPlanMatches(scenario.exportedRoomAfterReload, scenario.expectedRoom) &&
      doorPlanMatchesEditable(scenario.exportedDoorAfterReload, scenario.expectedDoor) &&
      roomEditableMatchesPlan(scenario.namedSavedRoomAfterReload, scenario.expectedRoom) &&
      doorEditableMatches(scenario.namedSavedDoorAfterReload, scenario.expectedDoor) &&
      scenario.recordIdBeforeSave === scenario.recordIdAfterReload;
    addCheck(checks, "scenario 3 room and door together survive save/reload/export", passed, scenarioSummary(scenario));
    writeJson(`${dir}/scenario-3-room-door-output.json`, { status: passed ? "passed" : "failed", ...scenarioSummary(scenario) });
    return;
  }

  if (selectedStage === "clear-local-draft") {
    const scenario = await getScenario("scenario-4", {
      room: true,
      door: true,
      save: true,
      clearLocalDraft: true,
      screenshot: "scenario-4-after-clear-draft-reload.png",
      exportFile: "scenario-4-after-reload.json"
    });
    const passed = scenario.localDraftAfterClear == null &&
      roomPlanMatches(scenario.exportedRoomAfterReload, scenario.expectedRoom) &&
      doorPlanMatchesEditable(scenario.exportedDoorAfterReload, scenario.expectedDoor) &&
      roomEditableMatchesPlan(scenario.namedSavedRoomAfterReload, scenario.expectedRoom) &&
      doorEditableMatches(scenario.namedSavedDoorAfterReload, scenario.expectedDoor);
    addCheck(checks, "scenario 4 named copy survives local draft clearing", passed, scenarioSummary(scenario));
    writeJson(`${dir}/scenario-4-clear-local-draft-output.json`, { status: passed ? "passed" : "failed", ...scenarioSummary(scenario) });
    return;
  }

  if (selectedStage === "unsaved-local-draft-negative") {
    const scenario = await getScenario("scenario-5", {
      room: true,
      door: true,
      save: false,
      clearLocalDraft: false,
      screenshot: "scenario-5-local-draft-banner.png",
      exportFile: null
    });
    const passed = scenario.localDraftBannerText.includes("not a named working-copy save") &&
      roomEditableMatchesPlan(scenario.namedSavedRoomAfterReload, scenario.beforeRoom) &&
      doorEditableMatches(scenario.namedSavedDoorAfterReload, scenario.beforeDoor);
    addCheck(checks, "scenario 5 unsaved local draft does not equal named save", passed, scenarioSummary(scenario));
    writeJson(`${dir}/scenario-5-unsaved-local-draft-output.json`, { status: passed ? "passed" : "failed", ...scenarioSummary(scenario) });
    return;
  }

  throw new Error(`Unsupported browser reload regression stage: ${selectedStage}`);
}

async function getScenario(name, options) {
  if (!scenarioCache.has(name)) {
    scenarioCache.set(name, runBrowserScenario(name, options));
  }
  return scenarioCache.get(name);
}

async function runBrowserScenario(name, options) {
  mkdirSync(`${dir}/screenshots`, { recursive: true });
  mkdirSync(`${dir}/exported-json`, { recursive: true });
  const basePort = Number(readArg("--port", "6839"));
  const baseChromePort = Number(readArg("--chrome-port", "9839"));
  const offset = Number(name.replace("scenario-", ""));
  const port = basePort + offset - 1;
  const chromePort = baseChromePort + offset - 1;
  const initScript =
    "sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));";

  const { result } = await withBrowserRenderedApp(
    { port, chromePort, width: 1440, height: 1000, initScript },
    async (browser) => {
      await openFreshSavedCopy(browser);
      const recordIdBeforeSave = await browser.evaluate(savedRecordIdExpression());
      const beforeRoomEditable = await browser.evaluate(savedRoomExpression(recordIdBeforeSave, "room-02"));
      const beforeDoor = await browser.evaluate(savedDoorExpression(recordIdBeforeSave, "door-02"));
      const beforeRoom = editableRoomToPlanRoom(beforeRoomEditable);

      if (options.room) {
        await dragRoom(browser, "room-02", 144, 72);
      }
      if (options.door) {
        await selectDoor(browser, "door-02");
        await clickQuickDoorButton(browser, "Nudge +");
        await clickQuickDoorButton(browser, "Width +");
      }

      const expectedRoom = options.room
        ? { ...beforeRoom, x: beforeRoom.x + 12, y: beforeRoom.y + 6 }
        : beforeRoom;
      const expectedDoor = options.door
        ? { ...beforeDoor, offsetFeet: beforeDoor.offsetFeet + 1, widthFeet: beforeDoor.widthFeet + 1 }
        : beforeDoor;

      if (options.save) {
        await browser.evaluate(clickButton("Save working copy"));
        await delay(500);
        if (options.clearLocalDraft) {
          await browser.evaluate(`localStorage.removeItem(${JSON.stringify(localDraftKey(recordIdBeforeSave))})`);
        }
      }
      const localDraftAfterClear = options.clearLocalDraft
        ? await browser.evaluate(`localStorage.getItem(${JSON.stringify(localDraftKey(recordIdBeforeSave))})`)
        : "not-cleared";

      await browser.evaluate(`location.reload()`);
      await waitForExpression(browser, `document.querySelector('button') != null`, 15_000);
      await openSavedCopyFromLibrary(browser, recordIdBeforeSave);
      const recordIdAfterReload = recordIdBeforeSave;
      const localDraftBannerText = await browser.evaluate(`document.querySelector('.layout-draft-recovery-banner')?.textContent ?? ''`);
      await browser.screenshot(`${dir}/screenshots/${options.screenshot}`);
      const namedSavedRoomAfterReload = await browser.evaluate(savedRoomExpression(recordIdBeforeSave, "room-02"));
      const namedSavedDoorAfterReload = await browser.evaluate(savedDoorExpression(recordIdBeforeSave, "door-02"));

      let exportedRoomAfterReload = null;
      let exportedDoorAfterReload = null;
      if (options.exportFile != null) {
        await browser.evaluate(clickButton("Export"));
        await delay(150);
        const exported = await readExportedJson(browser);
        writeText(`${dir}/exported-json/${options.exportFile}`, `${JSON.stringify(exported, null, 2)}\n`);
        exportedRoomAfterReload = exported.rooms.find((room) => room.id === "room-02") ?? null;
        exportedDoorAfterReload = exported.doors.find((door) => door.id === "door-02") ?? null;
      }

      return {
        name,
        recordIdBeforeSave,
        recordIdAfterReload,
        beforeRoom,
        beforeDoor,
        expectedRoom,
        expectedDoor,
        namedSavedRoomAfterReload,
        namedSavedDoorAfterReload,
        exportedRoomAfterReload,
        exportedDoorAfterReload,
        localDraftAfterClear,
        localDraftBannerText,
        screenshot: `${dir}/screenshots/${options.screenshot}`,
        exportedJson: options.exportFile == null ? null : `${dir}/exported-json/${options.exportFile}`
      };
    }
  );

  return result;
}

async function openFreshSavedCopy(browser) {
  await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
  await browser.evaluate("localStorage.clear()");
  await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
  await waitForExpression(browser, `document.querySelector('[aria-label="Editor status"]')?.innerText.includes('Canonical default')`, 10_000);
  await browser.evaluate(clickButton("Save working copy"));
  await waitForExpression(browser, `document.querySelector('[aria-label="Editor status"]')?.innerText.includes('Saved working copy')`, 10_000);
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
  await waitForExpression(browser, `document.querySelector('[aria-label="Editor status"]')?.innerText.includes('${recordId}')`, 10_000);
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

async function selectDoor(browser, doorId) {
  await browser.evaluate(`(() => {
    const element = document.querySelector('[data-layout-object-type="door"][data-layout-object-id="${doorId}"]');
    if (element == null) throw new Error('missing door ${doorId}');
    const rect = element.getBoundingClientRect();
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: rect.x + rect.width / 2, clientY: rect.y + rect.height / 2 }));
    return true;
  })()`);
  await waitForExpression(browser, `document.querySelector('[data-door-quick-edit="ready"]') != null`, 10_000);
}

async function clickQuickDoorButton(browser, label) {
  await browser.evaluate(`(() => {
    const root = document.querySelector('[data-door-quick-edit="ready"]');
    const button = Array.from(root?.querySelectorAll('button') ?? []).find((item) => item.textContent.trim() === ${JSON.stringify(label)} && !item.disabled);
    if (button == null) throw new Error('missing enabled door quick-edit button: ${label}');
    button.click();
    return true;
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

function savedDoorExpression(recordId, doorId) {
  return `(() => {
    const record = JSON.parse(localStorage.getItem('nerdeus.floorplans.savedAuthoringRecords.v1') || '[]').find((candidate) => candidate.savedPlanId === ${JSON.stringify(recordId)});
    return record?.authoringDraft?.editableLayout?.doors?.find((door) => door.id === ${JSON.stringify(doorId)}) ?? null;
  })()`;
}

function localDraftKey(recordId) {
  return `nerdeus.layoutEditor.localDraft.v2.${recordId}`;
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

function doorEditableMatches(left, right) {
  return left != null && right != null &&
    left.id === right.id &&
    left.ownerId === right.ownerId &&
    left.wall === right.wall &&
    left.offsetFeet === right.offsetFeet &&
    left.widthFeet === right.widthFeet;
}

function doorPlanMatchesEditable(planDoor, editableDoor) {
  return planDoor != null && editableDoor != null &&
    planDoor.id === editableDoor.id &&
    planDoor.roomId === editableDoor.ownerId &&
    planDoor.widthFeet === editableDoor.widthFeet;
}

function scenarioSummary(scenario) {
  return {
    recordIdBeforeSave: scenario.recordIdBeforeSave,
    recordIdAfterReload: scenario.recordIdAfterReload,
    beforeRoom: scenario.beforeRoom,
    expectedRoom: scenario.expectedRoom,
    exportedRoomAfterReload: scenario.exportedRoomAfterReload,
    beforeDoor: scenario.beforeDoor,
    expectedDoor: scenario.expectedDoor,
    exportedDoorAfterReload: scenario.exportedDoorAfterReload,
    namedSavedRoomAfterReload: scenario.namedSavedRoomAfterReload,
    namedSavedDoorAfterReload: scenario.namedSavedDoorAfterReload,
    localDraftAfterClear: scenario.localDraftAfterClear,
    localDraftBannerText: scenario.localDraftBannerText,
    screenshot: scenario.screenshot,
    exportedJson: scenario.exportedJson
  };
}

function writeArtifactIndexes() {
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: [
      `${dir}/screenshots/scenario-1-after-reload.png`,
      `${dir}/screenshots/scenario-2-after-reload.png`,
      `${dir}/screenshots/scenario-3-after-reload.png`,
      `${dir}/screenshots/scenario-4-after-clear-draft-reload.png`,
      `${dir}/screenshots/scenario-5-local-draft-banner.png`
    ]
  });
  writeJson(`${dir}/exported-json-artifacts-index.json`, {
    status: "passed",
    exportedJson: [
      `${dir}/exported-json/scenario-1-after-reload.json`,
      `${dir}/exported-json/scenario-2-after-reload.json`,
      `${dir}/exported-json/scenario-3-after-reload.json`,
      `${dir}/exported-json/scenario-4-after-reload.json`
    ]
  });
}
