#!/usr/bin/env node
import { mkdirSync } from "node:fs";
import { join } from "node:path";
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
const issue = readArg("--issue", "632");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: user-reported room move and door change did not persist after named-copy save/reload.\n"
);

const stages = stage === "final"
  ? [
      "red-mode-detects-loss",
      "browser-save-reload",
      "room-move-compare",
      "door-change-compare",
      "same-record-reload"
    ]
  : [stage];

let scenario = null;
for (const selectedStage of stages) {
  await runStage(selectedStage);
}

const passed = statusFromChecks(checks) === "passed";
if (passed) {
  updateSaveReloadManifest(issue, {
    redReproductionHarnessStatus: "passed",
    redFailureDetected: true,
    manifestFalsePositiveNegativeProof: true
  });
}

writeJson(`${dir}/test-output/save-failure-repro.txt`, {
  status: passed ? "passed" : "failed",
  stage,
  issue,
  checks
});

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-layout-editor-save-failure-repro.mjs --stage red-mode-detects-loss --allow-partial --issue 632",
  "node scripts/check-layout-editor-save-failure-repro.mjs --stage browser-save-reload --allow-partial --issue 632",
  "node scripts/check-layout-editor-save-failure-repro.mjs --stage room-move-compare --allow-partial --issue 632",
  "node scripts/check-layout-editor-save-failure-repro.mjs --stage door-change-compare --allow-partial --issue 632",
  "node scripts/check-layout-editor-save-failure-repro.mjs --stage same-record-reload --allow-partial --issue 632",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, {
  "node scripts/check-layout-editor-save-failure-repro.mjs --stage red-mode-detects-loss --allow-partial --issue 632": `${dir}/red-mode-detection-output.json`,
  "node scripts/check-layout-editor-save-failure-repro.mjs --stage browser-save-reload --allow-partial --issue 632": `${dir}/green-mode-browser-output.json`,
  "node scripts/check-layout-editor-save-failure-repro.mjs --stage room-move-compare --allow-partial --issue 632": `${dir}/room-before-after-output.json`,
  "node scripts/check-layout-editor-save-failure-repro.mjs --stage door-change-compare --allow-partial --issue 632": `${dir}/door-before-after-output.json`,
  "node scripts/check-layout-editor-save-failure-repro.mjs --stage same-record-reload --allow-partial --issue 632": `${dir}/same-record-output.json`
});
writeCloseout(issue, "Red/green browser harness reproduces and guards the reported room/door save-loss workflow.", passed ? "passed" : "failed", commands, [
  "This issue adds browser verification only; product persistence repair and UI copy changes are handled in later issues.",
  "Browser evidence uses synthetic operational rooms and doors only."
]);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", stage, issue, checks }, null, 2));
if (!passed && !allowPartial) process.exit(1);

async function runStage(selectedStage) {
  if (selectedStage === "red-mode-detects-loss") {
    const red = detectReloadLoss({
      before: {
        recordIdBeforeSave: "saved-default-er-layout-plan-1-001",
        recordIdAfterReload: "saved-default-er-layout-plan-1-001",
        roomBefore: { id: "room-02", xFeet: 44, yFeet: 28, widthFeet: 10, heightFeet: 10 },
        roomExpected: { id: "room-02", xFeet: 56, yFeet: 34, widthFeet: 10, heightFeet: 10 },
        doorBefore: { id: "door-02", ownerId: "room-02", wall: "south", offsetFeet: 3.5, widthFeet: 3 },
        doorExpected: { id: "door-02", ownerId: "room-02", wall: "south", offsetFeet: 4.5, widthFeet: 4 }
      },
      after: {
        roomAfterReload: { id: "room-02", xFeet: 44, yFeet: 28, widthFeet: 10, heightFeet: 10 },
        doorAfterReload: { id: "door-02", ownerId: "room-02", wall: "south", offsetFeet: 3.5, widthFeet: 3 }
      }
    });
    const passed = red.status === "failed" && red.failures.some((failure) => failure.includes("room")) &&
      red.failures.some((failure) => failure.includes("door"));
    addCheck(checks, "RED fixture detects stale saved room and door payload", passed, red);
    writeJson(`${dir}/red-mode-detection-output.json`, {
      status: passed ? "passed" : "failed",
      detectedFailure: red,
      redFailureDetected: passed
    });
    return;
  }

  scenario ??= await runBrowserSaveReloadScenario();

  if (selectedStage === "browser-save-reload") {
    const passed = scenario.comparison.status === "passed";
    addCheck(checks, "browser save/reload preserves changed room and door values", passed, scenario.comparison);
    writeJson(`${dir}/green-mode-browser-output.json`, {
      status: passed ? "passed" : "failed",
      recordIdBeforeSave: scenario.recordIdBeforeSave,
      recordIdAfterReload: scenario.recordIdAfterReload,
      comparison: scenario.comparison,
      saveStatusText: scenario.saveStatusText
    });
    writeJson(`${dir}/reload-compare-output.json`, {
      status: passed ? "passed" : "failed",
      comparison: scenario.comparison
    });
    writeJson(`${dir}/exported-json-compare-output.json`, {
      status: scenario.exportedPlanMatches ? "passed" : "failed",
      exportedRoom: scenario.exportedRoomAfterReload,
      exportedDoor: scenario.exportedDoorAfterReload
    });
    return;
  }

  if (selectedStage === "room-move-compare") {
    const passed = roomMatches(scenario.roomAfterReload, scenario.roomExpected) &&
      scenario.roomExpected.xFeet !== scenario.roomBefore.xFeet &&
      scenario.roomExpected.yFeet !== scenario.roomBefore.yFeet;
    addCheck(checks, "room changed x/y survives reload", passed, {
      before: scenario.roomBefore,
      expected: scenario.roomExpected,
      afterReload: scenario.roomAfterReload
    });
    writeJson(`${dir}/room-before-after-output.json`, {
      status: passed ? "passed" : "failed",
      before: scenario.roomBefore,
      expected: scenario.roomExpected,
      afterReload: scenario.roomAfterReload
    });
    return;
  }

  if (selectedStage === "door-change-compare") {
    const passed = doorMatches(scenario.doorAfterReload, scenario.doorExpected) &&
      (scenario.doorExpected.offsetFeet !== scenario.doorBefore.offsetFeet ||
        scenario.doorExpected.widthFeet !== scenario.doorBefore.widthFeet);
    addCheck(checks, "door changed offset/width survives reload", passed, {
      before: scenario.doorBefore,
      expected: scenario.doorExpected,
      afterReload: scenario.doorAfterReload
    });
    writeJson(`${dir}/door-before-after-output.json`, {
      status: passed ? "passed" : "failed",
      before: scenario.doorBefore,
      expected: scenario.doorExpected,
      afterReload: scenario.doorAfterReload
    });
    return;
  }

  if (selectedStage === "same-record-reload") {
    const passed = scenario.recordIdBeforeSave === scenario.recordIdAfterReload &&
      scenario.reopenedViaLibraryRecordId === scenario.recordIdBeforeSave;
    addCheck(checks, "reload opens exact same saved recordId", passed, {
      recordIdBeforeSave: scenario.recordIdBeforeSave,
      reopenedViaLibraryRecordId: scenario.reopenedViaLibraryRecordId,
      recordIdAfterReload: scenario.recordIdAfterReload
    });
    writeJson(`${dir}/same-record-output.json`, {
      status: passed ? "passed" : "failed",
      recordIdBeforeSave: scenario.recordIdBeforeSave,
      reopenedViaLibraryRecordId: scenario.reopenedViaLibraryRecordId,
      recordIdAfterReload: scenario.recordIdAfterReload
    });
    return;
  }

  throw new Error(`Unsupported save-failure reproduction stage: ${selectedStage}`);
}

async function runBrowserSaveReloadScenario() {
  mkdirSync(join(dir, "screenshots"), { recursive: true });
  mkdirSync(join(dir, "exported-json"), { recursive: true });
  const port = Number(readArg("--port", "6832"));
  const chromePort = Number(readArg("--chrome-port", "9832"));
  const initScript =
    "sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));";

  const { result } = await withBrowserRenderedApp(
    { port, chromePort, width: 1440, height: 1000, initScript },
    async (browser) => {
      await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
      await browser.evaluate("localStorage.clear()");
      await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
      await waitForExpression(browser, `document.querySelector('[aria-label="Editor status"]')?.innerText.includes('default-er-layout-plan-1')`, 10_000);
      await browser.evaluate(clickButton("Save working copy"));
      await waitForExpression(browser, `document.querySelector('[aria-label="Editor status"]')?.innerText.includes('Editable')`, 10_000);
      await browser.screenshot(`${dir}/screenshots/before-edit.png`);
      await browser.evaluate(clickButton("Export"));
      await delay(150);
      const beforeExported = await readExportedJson(browser);
      writeText(`${dir}/exported-json/before-edit.json`, `${JSON.stringify(beforeExported, null, 2)}\n`);

      const recordIdBeforeSave = await browser.evaluate(savedRecordIdExpression());
      const roomBefore = await browser.evaluate(savedRoomExpression("room-02"));
      const doorBefore = await browser.evaluate(savedDoorExpression("door-02"));

      await dragRoom(browser, "room-02", 144, 72);
      await selectDoor(browser, "door-02");
      await clickQuickDoorButton(browser, "Nudge +");
      await clickQuickDoorButton(browser, "Width +");
      await delay(150);
      await browser.screenshot(`${dir}/screenshots/after-room-door-change.png`);

      await browser.evaluate(clickButton("Save working copy"));
      await delay(500);
      await browser.screenshot(`${dir}/screenshots/after-save-status.png`);
      const saveStatusText = await browser.evaluate(`document.querySelector('[aria-label="Editor status"]')?.innerText ?? ''`);
      const roomExpected = await browser.evaluate(savedRoomExpression("room-02"));
      const doorExpected = await browser.evaluate(savedDoorExpression("door-02"));

      await browser.evaluate(`location.reload()`);
      await waitForExpression(browser, `document.querySelector('button') != null`, 15_000);
      await browser.navigate(`${browser.baseUrl}/?section=floorplans`, `document.querySelector('[data-record-id="${recordIdBeforeSave}"]') != null`);
      const reopenedViaLibraryRecordId = await browser.evaluate(`(() => {
        const card = document.querySelector('[data-record-id="${recordIdBeforeSave}"]');
        const button = Array.from(card.querySelectorAll('button')).find((item) => item.textContent.trim() === 'Open Saved Floorplan');
        button?.click();
        return card.getAttribute('data-record-id');
      })()`);
      await delay(300);
      await browser.evaluate(clickButton("Editor"));
      await waitForExpression(browser, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`, 10_000);
      await waitForExpression(browser, `document.querySelector('[aria-label="Editor status"]')?.innerText.includes('Editable')`, 10_000);
      await browser.screenshot(`${dir}/screenshots/after-reload-same-copy.png`);

      const recordIdAfterReload = await browser.evaluate(savedRecordIdExpression());
      const roomAfterReload = await browser.evaluate(savedRoomExpression("room-02"));
      const doorAfterReload = await browser.evaluate(savedDoorExpression("door-02"));
      await browser.evaluate(clickButton("Export"));
      await delay(150);
      const afterExported = await readExportedJson(browser);
      writeText(`${dir}/exported-json/after-reload.json`, `${JSON.stringify(afterExported, null, 2)}\n`);

      return {
        recordIdBeforeSave,
        reopenedViaLibraryRecordId,
        recordIdAfterReload,
        roomBefore,
        doorBefore,
        roomExpected,
        doorExpected,
        roomAfterReload,
        doorAfterReload,
        beforeExported,
        afterExported,
        saveStatusText
      };
    }
  );

  const exportedRoomAfterReload = result.afterExported.rooms.find((room) => room.id === "room-02");
  const exportedDoorAfterReload = result.afterExported.doors.find((door) => door.id === "door-02");
  const comparison = detectReloadLoss({
    before: result,
    after: {
      roomAfterReload: result.roomAfterReload,
      doorAfterReload: result.doorAfterReload
    }
  });
  const exportedPlanMatches =
    exportedRoomAfterReload?.x === result.roomExpected.xFeet &&
    exportedRoomAfterReload?.y === result.roomExpected.yFeet &&
    exportedDoorAfterReload?.widthFeet === result.doorExpected.widthFeet;

  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: [
      `${dir}/screenshots/before-edit.png`,
      `${dir}/screenshots/after-room-door-change.png`,
      `${dir}/screenshots/after-save-status.png`,
      `${dir}/screenshots/after-reload-same-copy.png`
    ]
  });

  return {
    ...result,
    exportedRoomAfterReload,
    exportedDoorAfterReload,
    comparison,
    exportedPlanMatches
  };
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

function savedRoomExpression(roomId) {
  return `JSON.parse(localStorage.getItem('nerdeus.floorplans.savedAuthoringRecords.v1') || '[]')[0]?.authoringDraft?.editableLayout?.rooms?.find((room) => room.id === ${JSON.stringify(roomId)}) ?? null`;
}

function savedDoorExpression(doorId) {
  return `JSON.parse(localStorage.getItem('nerdeus.floorplans.savedAuthoringRecords.v1') || '[]')[0]?.authoringDraft?.editableLayout?.doors?.find((door) => door.id === ${JSON.stringify(doorId)}) ?? null`;
}

function detectReloadLoss({ before, after }) {
  const failures = [];
  if (before.recordIdBeforeSave !== before.recordIdAfterReload && before.recordIdAfterReload != null) {
    failures.push(`recordId mismatch: ${before.recordIdBeforeSave} vs ${before.recordIdAfterReload}`);
  }
  if (!roomMatches(after.roomAfterReload, before.roomExpected)) {
    failures.push("room geometry reverted or changed after reload");
  }
  if (!doorMatches(after.doorAfterReload, before.doorExpected)) {
    failures.push("door geometry reverted or changed after reload");
  }
  return {
    status: failures.length === 0 ? "passed" : "failed",
    failures
  };
}

function roomMatches(left, right) {
  return left != null && right != null &&
    left.id === right.id &&
    left.xFeet === right.xFeet &&
    left.yFeet === right.yFeet &&
    left.widthFeet === right.widthFeet &&
    left.heightFeet === right.heightFeet;
}

function doorMatches(left, right) {
  return left != null && right != null &&
    left.id === right.id &&
    left.ownerId === right.ownerId &&
    left.wall === right.wall &&
    left.offsetFeet === right.offsetFeet &&
    left.widthFeet === right.widthFeet;
}
