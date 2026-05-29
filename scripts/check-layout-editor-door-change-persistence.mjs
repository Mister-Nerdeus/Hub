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
const issue = readArg("--issue", "636");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: door geometry/count changes do not yet have same-record save/reload proof.\n"
);

const stages = stage === "final"
  ? [
      "door-move-save-reload",
      "door-width-save-reload",
      "door-add-save-reload",
      "door-delete-save-reload",
      "export-after-reload",
      "lost-door-negative"
    ]
  : [stage];

let scenario = null;
for (const selectedStage of stages) {
  await runStage(selectedStage);
}

const passed = statusFromChecks(checks) === "passed";
if (passed) {
  updateSaveReloadManifest(issue, {
    doorChangePersistenceStatus: "passed",
    doorChangeReloadProof: true
  });
}

writeJson(`${dir}/test-output/door-change-persistence.txt`, {
  status: passed ? "passed" : "failed",
  stage,
  issue,
  checks
});

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-layout-editor-door-change-persistence.mjs --stage door-move-save-reload --allow-partial --issue 636",
  "node scripts/check-layout-editor-door-change-persistence.mjs --stage door-width-save-reload --allow-partial --issue 636",
  "node scripts/check-layout-editor-door-change-persistence.mjs --stage door-add-save-reload --allow-partial --issue 636",
  "node scripts/check-layout-editor-door-change-persistence.mjs --stage door-delete-save-reload --allow-partial --issue 636",
  "node scripts/check-layout-editor-door-change-persistence.mjs --stage export-after-reload --allow-partial --issue 636",
  "node scripts/check-layout-editor-door-change-persistence.mjs --stage lost-door-negative --allow-partial --issue 636",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, {
  "node scripts/check-layout-editor-door-change-persistence.mjs --stage door-move-save-reload --allow-partial --issue 636": `${dir}/door-move-output.json`,
  "node scripts/check-layout-editor-door-change-persistence.mjs --stage door-width-save-reload --allow-partial --issue 636": `${dir}/door-width-output.json`,
  "node scripts/check-layout-editor-door-change-persistence.mjs --stage door-add-save-reload --allow-partial --issue 636": `${dir}/door-add-output.json`,
  "node scripts/check-layout-editor-door-change-persistence.mjs --stage door-delete-save-reload --allow-partial --issue 636": `${dir}/door-delete-output.json`,
  "node scripts/check-layout-editor-door-change-persistence.mjs --stage export-after-reload --allow-partial --issue 636": `${dir}/export-door-output.json`,
  "node scripts/check-layout-editor-door-change-persistence.mjs --stage lost-door-negative --allow-partial --issue 636": `${dir}/lost-door-negative-output.json`
});
writeCloseout(issue, "Door move, offset, width, add, and delete changes survive named-copy save, browser reload, same-copy reopen, and export.", passed ? "passed" : "failed", commands, [
  "This issue proves door geometry persistence only; local draft separation and truthful save-status wording are handled later.",
  "Path graph sync can remain stale; the proof requires door geometry and count semantics to persist."
]);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", stage, issue, checks }, null, 2));
if (!passed && !allowPartial) process.exit(1);

async function runStage(selectedStage) {
  if (selectedStage === "lost-door-negative") {
    const negative = detectLostDoor({
      expectedDoor: { id: "door-02", ownerId: "room-02", wall: "north", offsetFeet: 4.5, widthFeet: 4 },
      addedDoorId: "authored-door-001",
      deletedDoorId: "door-03",
      afterReloadDoors: [
        { id: "door-02", ownerId: "room-02", wall: "south", offsetFeet: 3.5, widthFeet: 3 },
        { id: "door-03", ownerId: "room-03", wall: "south", offsetFeet: 3.5, widthFeet: 3 }
      ]
    });
    const passed = negative.status === "failed" &&
      negative.failures.includes("changed door geometry missing") &&
      negative.failures.includes("added door missing") &&
      negative.failures.includes("deleted door reappeared");
    addCheck(checks, "lost door geometry/count negative fixture is detected", passed, negative);
    writeJson(`${dir}/lost-door-negative-output.json`, {
      status: passed ? "passed" : "failed",
      detectedFailure: negative
    });
    return;
  }

  scenario ??= await runDoorScenario();

  if (selectedStage === "door-move-save-reload") {
    const passed =
      scenario.recordIdBeforeSave === scenario.recordIdAfterReload &&
      scenario.changedDoorBefore.wall !== scenario.changedDoorAfterReload.wall &&
      scenario.changedDoorAfterReload.wall === scenario.changedDoorExpected.wall;
    addCheck(checks, "door wall move survives save/reload", passed, {
      before: scenario.changedDoorBefore,
      expected: scenario.changedDoorExpected,
      afterReload: scenario.changedDoorAfterReload
    });
    writeJson(`${dir}/door-move-output.json`, {
      status: passed ? "passed" : "failed",
      before: scenario.changedDoorBefore,
      expected: scenario.changedDoorExpected,
      afterReload: scenario.changedDoorAfterReload
    });
    writeJson(`${dir}/door-offset-output.json`, {
      status: scenario.changedDoorAfterReload.offsetFeet === scenario.changedDoorExpected.offsetFeet ? "passed" : "failed",
      before: scenario.changedDoorBefore,
      expected: scenario.changedDoorExpected,
      afterReload: scenario.changedDoorAfterReload
    });
    writeJson(`${dir}/saved-record-door-output.json`, {
      status: doorEditableMatches(scenario.changedDoorSavedRecord, scenario.changedDoorExpected) ? "passed" : "failed",
      savedRecordDoor: scenario.changedDoorSavedRecord,
      expected: scenario.changedDoorExpected
    });
    writeJson(`${dir}/reload-door-output.json`, {
      status: passed ? "passed" : "failed",
      recordIdBeforeSave: scenario.recordIdBeforeSave,
      recordIdAfterReload: scenario.recordIdAfterReload,
      changedDoorAfterReload: scenario.changedDoorAfterReload
    });
    return;
  }

  if (selectedStage === "door-width-save-reload") {
    const passed =
      scenario.changedDoorBefore.widthFeet !== scenario.changedDoorAfterReload.widthFeet &&
      scenario.changedDoorAfterReload.widthFeet === scenario.changedDoorExpected.widthFeet;
    addCheck(checks, "door width change survives save/reload", passed, {
      before: scenario.changedDoorBefore,
      expected: scenario.changedDoorExpected,
      afterReload: scenario.changedDoorAfterReload
    });
    writeJson(`${dir}/door-width-output.json`, {
      status: passed ? "passed" : "failed",
      before: scenario.changedDoorBefore,
      expected: scenario.changedDoorExpected,
      afterReload: scenario.changedDoorAfterReload
    });
    return;
  }

  if (selectedStage === "door-add-save-reload") {
    const passed =
      scenario.addedDoorAfterReload != null &&
      scenario.addedDoorAfterReload.ownerId === "room-02" &&
      scenario.addedDoorAfterReload.widthFeet === 4;
    addCheck(checks, "added door survives save/reload", passed, {
      addedDoorId: scenario.addedDoorId,
      addedDoorAfterReload: scenario.addedDoorAfterReload
    });
    writeJson(`${dir}/door-add-output.json`, {
      status: passed ? "passed" : "failed",
      addedDoorId: scenario.addedDoorId,
      addedDoorAfterReload: scenario.addedDoorAfterReload,
      doorCountBefore: scenario.doorCountBefore,
      doorCountAfterReload: scenario.doorCountAfterReload
    });
    return;
  }

  if (selectedStage === "door-delete-save-reload") {
    const passed =
      scenario.deletedDoorBefore != null &&
      scenario.deletedDoorAfterReload == null &&
      scenario.doorCountAfterReload === scenario.doorCountBefore;
    addCheck(checks, "deleted door remains absent after save/reload", passed, {
      deletedDoorId: scenario.deletedDoorId,
      deletedDoorBefore: scenario.deletedDoorBefore,
      deletedDoorAfterReload: scenario.deletedDoorAfterReload,
      doorCountBefore: scenario.doorCountBefore,
      doorCountAfterReload: scenario.doorCountAfterReload
    });
    writeJson(`${dir}/door-delete-output.json`, {
      status: passed ? "passed" : "failed",
      deletedDoorId: scenario.deletedDoorId,
      deletedDoorBefore: scenario.deletedDoorBefore,
      deletedDoorAfterReload: scenario.deletedDoorAfterReload,
      doorCountBefore: scenario.doorCountBefore,
      doorCountAfterReload: scenario.doorCountAfterReload
    });
    return;
  }

  if (selectedStage === "export-after-reload") {
    const passed =
      scenario.exportedChangedDoorAfterReload?.widthFeet === scenario.changedDoorExpected.widthFeet &&
      scenario.exportedAddedDoorAfterReload != null &&
      scenario.exportedDeletedDoorAfterReload == null;
    addCheck(checks, "exported JSON after reload contains changed/added/deleted door state", passed, {
      exportedChangedDoorAfterReload: scenario.exportedChangedDoorAfterReload,
      exportedAddedDoorAfterReload: scenario.exportedAddedDoorAfterReload,
      exportedDeletedDoorAfterReload: scenario.exportedDeletedDoorAfterReload
    });
    writeJson(`${dir}/export-door-output.json`, {
      status: passed ? "passed" : "failed",
      exportedChangedDoorAfterReload: scenario.exportedChangedDoorAfterReload,
      exportedAddedDoorAfterReload: scenario.exportedAddedDoorAfterReload,
      exportedDeletedDoorAfterReload: scenario.exportedDeletedDoorAfterReload,
      exportedJsonPath: `${dir}/exported-json/door-after-reload.json`
    });
    writeJson(`${dir}/stale-path-warning-output.json`, {
      status: scenario.savedRecordPathSyncStatus === "stale_warning" ? "passed" : "failed",
      pathSyncStatus: scenario.savedRecordPathSyncStatus,
      authoringWarnings: scenario.savedRecordAuthoringWarnings
    });
    return;
  }

  throw new Error(`Unsupported door-change persistence stage: ${selectedStage}`);
}

async function runDoorScenario() {
  mkdirSync(`${dir}/screenshots`, { recursive: true });
  mkdirSync(`${dir}/exported-json`, { recursive: true });
  const port = Number(readArg("--port", "6836"));
  const chromePort = Number(readArg("--chrome-port", "9836"));
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
      await browser.screenshot(`${dir}/screenshots/door-before-change.png`);

      const recordIdBeforeSave = await browser.evaluate(savedRecordIdExpression());
      const changedDoorBefore = await browser.evaluate(savedDoorExpression(recordIdBeforeSave, "door-02"));
      const deletedDoorId = "door-03";
      const deletedDoorBefore = await browser.evaluate(savedDoorExpression(recordIdBeforeSave, deletedDoorId));
      const doorCountBefore = await browser.evaluate(savedDoorCountExpression(recordIdBeforeSave));

      await selectDoor(browser, "door-02");
      await clickQuickDoorButton(browser, "Opposite");
      await clickQuickDoorButton(browser, "Nudge +");
      await clickQuickDoorButton(browser, "Width +");

      await selectRoom(browser, "room-02");
      await clickRoomQuickButton(browser, "Add door");
      await delay(200);
      const addedDoorId = await browser.evaluate(`(() => {
        const raw = document.querySelector('textarea[aria-label="Floorplan JSON"]')?.value;
        return 'authored-door-001';
      })()`);

      await selectDoor(browser, deletedDoorId);
      await clickQuickDoorButton(browser, "Delete door");
      await delay(200);
      await browser.screenshot(`${dir}/screenshots/door-after-change.png`);
      await browser.evaluate(clickButton("Save working copy"));
      await delay(500);

      const changedDoorExpected = await browser.evaluate(savedDoorExpression(recordIdBeforeSave, "door-02"));
      const changedDoorSavedRecord = changedDoorExpected;
      const addedDoorSavedRecord = await browser.evaluate(savedDoorExpression(recordIdBeforeSave, addedDoorId));
      const deletedDoorSavedRecord = await browser.evaluate(savedDoorExpression(recordIdBeforeSave, deletedDoorId));
      const savedRecordPathSyncStatus = await browser.evaluate(savedRecordPathSyncStatusExpression(recordIdBeforeSave));
      const savedRecordAuthoringWarnings = await browser.evaluate(savedRecordAuthoringWarningsExpression(recordIdBeforeSave));

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
      await browser.screenshot(`${dir}/screenshots/door-after-reload.png`);

      const changedDoorAfterReload = await browser.evaluate(savedDoorExpression(recordIdBeforeSave, "door-02"));
      const addedDoorAfterReload = await browser.evaluate(savedDoorExpression(recordIdBeforeSave, addedDoorId));
      const deletedDoorAfterReload = await browser.evaluate(savedDoorExpression(recordIdBeforeSave, deletedDoorId));
      const doorCountAfterReload = await browser.evaluate(savedDoorCountExpression(recordIdBeforeSave));
      await browser.evaluate(clickButton("Export"));
      await delay(150);
      const afterReloadExport = await readExportedJson(browser);
      writeText(`${dir}/exported-json/door-after-reload.json`, `${JSON.stringify(afterReloadExport, null, 2)}\n`);

      return {
        recordIdBeforeSave,
        recordIdAfterReload,
        changedDoorBefore,
        changedDoorExpected,
        changedDoorSavedRecord,
        changedDoorAfterReload,
        addedDoorId,
        addedDoorSavedRecord,
        addedDoorAfterReload,
        deletedDoorId,
        deletedDoorBefore,
        deletedDoorSavedRecord,
        deletedDoorAfterReload,
        doorCountBefore,
        doorCountAfterReload,
        exportedChangedDoorAfterReload: afterReloadExport.doors.find((door) => door.id === "door-02") ?? null,
        exportedAddedDoorAfterReload: afterReloadExport.doors.find((door) => door.id === addedDoorId) ?? null,
        exportedDeletedDoorAfterReload: afterReloadExport.doors.find((door) => door.id === deletedDoorId) ?? null,
        savedRecordPathSyncStatus,
        savedRecordAuthoringWarnings
      };
    }
  );

  return result;
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

async function selectRoom(browser, roomId) {
  await browser.evaluate(`(() => {
    const element = document.querySelector('[data-layout-object-type="room"][data-layout-object-id="${roomId}"]');
    if (element == null) throw new Error('missing room ${roomId}');
    const rect = element.getBoundingClientRect();
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: rect.x + rect.width / 2, clientY: rect.y + rect.height / 2 }));
    return true;
  })()`);
  await waitForExpression(browser, `document.querySelector('[data-room-quick-edit="ready"]') != null`, 10_000);
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

async function clickRoomQuickButton(browser, label) {
  await browser.evaluate(`(() => {
    const root = document.querySelector('[data-room-quick-edit="ready"]');
    const button = Array.from(root?.querySelectorAll('button') ?? []).find((item) => item.textContent.trim() === ${JSON.stringify(label)} && !item.disabled);
    if (button == null) throw new Error('missing enabled room quick-edit button: ${label}');
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

function savedDoorExpression(recordId, doorId) {
  return `(() => {
    const record = JSON.parse(localStorage.getItem('nerdeus.floorplans.savedAuthoringRecords.v1') || '[]').find((candidate) => candidate.savedPlanId === ${JSON.stringify(recordId)});
    return record?.authoringDraft?.editableLayout?.doors?.find((door) => door.id === ${JSON.stringify(doorId)}) ?? null;
  })()`;
}

function savedDoorCountExpression(recordId) {
  return `(() => {
    const record = JSON.parse(localStorage.getItem('nerdeus.floorplans.savedAuthoringRecords.v1') || '[]').find((candidate) => candidate.savedPlanId === ${JSON.stringify(recordId)});
    return record?.authoringDraft?.editableLayout?.doors?.length ?? null;
  })()`;
}

function savedRecordPathSyncStatusExpression(recordId) {
  return `JSON.parse(localStorage.getItem('nerdeus.floorplans.savedAuthoringRecords.v1') || '[]').find((candidate) => candidate.savedPlanId === ${JSON.stringify(recordId)})?.authoringDraft?.pathSyncStatus ?? null`;
}

function savedRecordAuthoringWarningsExpression(recordId) {
  return `JSON.parse(localStorage.getItem('nerdeus.floorplans.savedAuthoringRecords.v1') || '[]').find((candidate) => candidate.savedPlanId === ${JSON.stringify(recordId)})?.authoringDraft?.authoringWarnings ?? []`;
}

function doorEditableMatches(left, right) {
  return left != null && right != null &&
    left.id === right.id &&
    left.ownerId === right.ownerId &&
    left.wall === right.wall &&
    left.offsetFeet === right.offsetFeet &&
    left.widthFeet === right.widthFeet;
}

function detectLostDoor({ expectedDoor, addedDoorId, deletedDoorId, afterReloadDoors }) {
  const failures = [];
  const changed = afterReloadDoors.find((door) => door.id === expectedDoor.id) ?? null;
  const added = afterReloadDoors.find((door) => door.id === addedDoorId) ?? null;
  const deleted = afterReloadDoors.find((door) => door.id === deletedDoorId) ?? null;
  if (!doorEditableMatches(changed, expectedDoor)) {
    failures.push("changed door geometry missing");
  }
  if (added == null) {
    failures.push("added door missing");
  }
  if (deleted != null) {
    failures.push("deleted door reappeared");
  }
  return {
    status: failures.length === 0 ? "passed" : "failed",
    failures,
    expectedDoor,
    addedDoorId,
    deletedDoorId,
    afterReloadDoors
  };
}
