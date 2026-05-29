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
const issue = readArg("--issue", "637");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: local recovery draft and named saved copy are not yet separately proven.\n"
);

const stages = stage === "final"
  ? [
      "local-draft-only",
      "named-save-without-local-draft",
      "clear-local-draft-does-not-clear-named-save",
      "restore-not-named-save"
    ]
  : [stage];

let localDraftScenario = null;
let namedSaveScenario = null;
for (const selectedStage of stages) {
  await runStage(selectedStage);
}

const passed = statusFromChecks(checks) === "passed";
if (passed) {
  updateSaveReloadManifest(issue, {
    localDraftVsNamedSaveStatus: "passed",
    localDraftNamedSaveSeparationProof: true
  });
}

writeJson(`${dir}/test-output/local-draft-vs-named-save.txt`, {
  status: passed ? "passed" : "failed",
  stage,
  issue,
  checks
});

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-layout-editor-local-draft-vs-named-save.mjs --stage local-draft-only --allow-partial --issue 637",
  "node scripts/check-layout-editor-local-draft-vs-named-save.mjs --stage named-save-without-local-draft --allow-partial --issue 637",
  "node scripts/check-layout-editor-local-draft-vs-named-save.mjs --stage clear-local-draft-does-not-clear-named-save --allow-partial --issue 637",
  "node scripts/check-layout-editor-local-draft-vs-named-save.mjs --stage restore-not-named-save --allow-partial --issue 637",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, {
  "node scripts/check-layout-editor-local-draft-vs-named-save.mjs --stage local-draft-only --allow-partial --issue 637": `${dir}/local-draft-only-output.json`,
  "node scripts/check-layout-editor-local-draft-vs-named-save.mjs --stage named-save-without-local-draft --allow-partial --issue 637": `${dir}/named-save-without-local-draft-output.json`,
  "node scripts/check-layout-editor-local-draft-vs-named-save.mjs --stage clear-local-draft-does-not-clear-named-save --allow-partial --issue 637": `${dir}/clear-local-draft-output.json`,
  "node scripts/check-layout-editor-local-draft-vs-named-save.mjs --stage restore-not-named-save --allow-partial --issue 637": `${dir}/restore-not-named-save-output.json`
});
writeCloseout(issue, "Local recovery draft and named saved working-copy persistence are separately proven and separately described in UI copy.", passed ? "passed" : "failed", commands, [
  "This issue does not complete the broader truthful save-status work; Issue 638 removes/scopes remaining ambiguous command-bar wording.",
  "Local draft clearing in the browser proof is done through the documented localStorage key for the active saved record."
]);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", stage, issue, checks }, null, 2));
if (!passed && !allowPartial) process.exit(1);

async function runStage(selectedStage) {
  if (selectedStage === "local-draft-only") {
    localDraftScenario ??= await runLocalDraftOnlyScenario();
    const passed =
      localDraftScenario.localDraftRoom.xFeet === localDraftScenario.roomExpected.x &&
      localDraftScenario.restoredExportedRoom.x === localDraftScenario.roomExpected.x &&
      localDraftScenario.namedSavedRoomAfterRestore.xFeet === localDraftScenario.roomBefore.x &&
      localDraftScenario.bannerBeforeRestoreText.includes("not a named working-copy save");
    addCheck(checks, "unsaved local recovery draft restores locally without changing named saved copy", passed, localDraftScenario);
    writeJson(`${dir}/local-draft-only-output.json`, {
      status: passed ? "passed" : "failed",
      recordId: localDraftScenario.recordId,
      roomBefore: localDraftScenario.roomBefore,
      roomExpected: localDraftScenario.roomExpected,
      localDraftRoom: localDraftScenario.localDraftRoom,
      namedSavedRoomAfterRestore: localDraftScenario.namedSavedRoomAfterRestore,
      restoredExportedRoom: localDraftScenario.restoredExportedRoom,
      bannerBeforeRestoreText: localDraftScenario.bannerBeforeRestoreText
    });
    writeJson(`${dir}/status-separation-output.json`, {
      status: localDraftScenario.bannerBeforeRestoreText.includes("not a named working-copy save") ? "passed" : "failed",
      bannerBeforeRestoreText: localDraftScenario.bannerBeforeRestoreText,
      bannerAfterRestoreText: localDraftScenario.bannerAfterRestoreText
    });
    return;
  }

  if (selectedStage === "named-save-without-local-draft") {
    namedSaveScenario ??= await runNamedSaveWithLocalDraftClearedScenario();
    const passed =
      namedSaveScenario.localDraftAfterClear == null &&
      namedSaveScenario.reloadedExportedRoom.x === namedSaveScenario.roomExpected.x &&
      namedSaveScenario.reloadedSavedRoom.xFeet === namedSaveScenario.roomExpected.x;
    addCheck(checks, "named saved copy reloads after local draft is cleared", passed, namedSaveScenario);
    writeJson(`${dir}/named-save-without-local-draft-output.json`, {
      status: passed ? "passed" : "failed",
      recordId: namedSaveScenario.recordId,
      roomExpected: namedSaveScenario.roomExpected,
      localDraftAfterClear: namedSaveScenario.localDraftAfterClear,
      reloadedSavedRoom: namedSaveScenario.reloadedSavedRoom,
      reloadedExportedRoom: namedSaveScenario.reloadedExportedRoom
    });
    return;
  }

  if (selectedStage === "clear-local-draft-does-not-clear-named-save") {
    namedSaveScenario ??= await runNamedSaveWithLocalDraftClearedScenario();
    const passed =
      namedSaveScenario.localDraftAfterClear == null &&
      namedSaveScenario.reloadedSavedRoom.xFeet === namedSaveScenario.roomExpected.x;
    addCheck(checks, "clearing local draft does not erase named saved copy", passed, namedSaveScenario);
    writeJson(`${dir}/clear-local-draft-output.json`, {
      status: passed ? "passed" : "failed",
      recordId: namedSaveScenario.recordId,
      localDraftAfterClear: namedSaveScenario.localDraftAfterClear,
      reloadedSavedRoom: namedSaveScenario.reloadedSavedRoom
    });
    return;
  }

  if (selectedStage === "restore-not-named-save") {
    localDraftScenario ??= await runLocalDraftOnlyScenario();
    const bannerSource = readText("apps/web/src/features/layout-editor/LayoutDraftRecoveryBanner.tsx");
    const passed =
      bannerSource.includes("Named working copy was not saved by this restore") &&
      localDraftScenario.bannerAfterRestoreText.includes("Named working copy was not saved by this restore") &&
      localDraftScenario.namedStatusAfterRestore.includes("Not saved yet") &&
      localDraftScenario.namedSavedRoomAfterRestore.xFeet === localDraftScenario.roomBefore.x;
    addCheck(checks, "restoring local draft does not mark named copy saved", passed, {
      bannerAfterRestoreText: localDraftScenario.bannerAfterRestoreText,
      namedStatusAfterRestore: localDraftScenario.namedStatusAfterRestore
    });
    writeJson(`${dir}/restore-not-named-save-output.json`, {
      status: passed ? "passed" : "failed",
      bannerAfterRestoreText: localDraftScenario.bannerAfterRestoreText,
      namedStatusAfterRestore: localDraftScenario.namedStatusAfterRestore,
      namedSavedRoomAfterRestore: localDraftScenario.namedSavedRoomAfterRestore
    });
    return;
  }

  throw new Error(`Unsupported local-draft vs named-save stage: ${selectedStage}`);
}

async function runLocalDraftOnlyScenario() {
  mkdirSync(`${dir}/screenshots`, { recursive: true });
  const port = Number(readArg("--port", "6837"));
  const chromePort = Number(readArg("--chrome-port", "9837"));
  const initScript =
    "sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));";

  const { result } = await withBrowserRenderedApp(
    { port, chromePort, width: 1440, height: 1000, initScript },
    async (browser) => {
      await openFreshSavedCopy(browser);
      const recordId = await browser.evaluate(savedRecordIdExpression());
      const roomBeforeEditable = await browser.evaluate(savedRoomExpression(recordId, "room-02"));
      const roomBefore = editableRoomToPlanRoom(roomBeforeEditable);
      const roomExpected = { ...roomBefore, x: roomBefore.x + 12, y: roomBefore.y + 6 };

      await dragRoom(browser, "room-02", 144, 72);
      await waitForExpression(browser, localDraftRoomPredicate(recordId, "room-02", roomExpected.x), 10_000);
      const localDraftRoom = await browser.evaluate(localDraftRoomExpression(recordId, "room-02"));

      await browser.evaluate(`location.reload()`);
      await waitForExpression(browser, `document.querySelector('button') != null`, 15_000);
      await openSavedCopyFromLibrary(browser, recordId);
      await waitForExpression(browser, `document.querySelector('[data-draft-recovery-banner="available"]') != null`, 10_000);
      const bannerBeforeRestoreText = await draftBannerText(browser);
      await browser.screenshot(`${dir}/screenshots/local-draft-restored-not-saved.png`);
      await browser.evaluate(clickButton("Restore draft"));
      await waitForExpression(browser, `document.querySelector('.layout-draft-recovery-banner')?.textContent.includes('Named working copy was not saved by this restore')`, 10_000);
      const bannerAfterRestoreText = await draftBannerText(browser);
      const namedStatusAfterRestore = await editorStatusText(browser);
      await browser.evaluate(clickButton("Export"));
      await delay(150);
      const restoredExport = await readExportedJson(browser);
      const restoredExportedRoom = restoredExport.rooms.find((room) => room.id === "room-02");
      const namedSavedRoomAfterRestore = await browser.evaluate(savedRoomExpression(recordId, "room-02"));

      return {
        recordId,
        roomBefore,
        roomExpected,
        localDraftRoom,
        restoredExportedRoom,
        namedSavedRoomAfterRestore,
        bannerBeforeRestoreText,
        bannerAfterRestoreText,
        namedStatusAfterRestore
      };
    }
  );

  return result;
}

async function runNamedSaveWithLocalDraftClearedScenario() {
  mkdirSync(`${dir}/screenshots`, { recursive: true });
  const port = Number(readArg("--port", "6937"));
  const chromePort = Number(readArg("--chrome-port", "9937"));
  const initScript =
    "sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));";

  const { result } = await withBrowserRenderedApp(
    { port, chromePort, width: 1440, height: 1000, initScript },
    async (browser) => {
      await openFreshSavedCopy(browser);
      const recordId = await browser.evaluate(savedRecordIdExpression());
      const roomBeforeEditable = await browser.evaluate(savedRoomExpression(recordId, "room-02"));
      const roomBefore = editableRoomToPlanRoom(roomBeforeEditable);
      const roomExpected = { ...roomBefore, x: roomBefore.x + 12, y: roomBefore.y + 6 };

      await dragRoom(browser, "room-02", 144, 72);
      await waitForExpression(browser, localDraftRoomPredicate(recordId, "room-02", roomExpected.x), 10_000);
      await browser.evaluate(clickButton("Save working copy"));
      await delay(500);
      await browser.evaluate(`localStorage.removeItem(${JSON.stringify(localDraftKey(recordId))})`);
      const localDraftAfterClear = await browser.evaluate(`localStorage.getItem(${JSON.stringify(localDraftKey(recordId))})`);

      await browser.evaluate(`location.reload()`);
      await waitForExpression(browser, `document.querySelector('button') != null`, 15_000);
      await openSavedCopyFromLibrary(browser, recordId);
      await browser.screenshot(`${dir}/screenshots/named-copy-saved-with-local-draft-cleared.png`);
      const reloadedSavedRoom = await browser.evaluate(savedRoomExpression(recordId, "room-02"));
      await browser.evaluate(clickButton("Export"));
      await delay(150);
      const reloadedExport = await readExportedJson(browser);
      const reloadedExportedRoom = reloadedExport.rooms.find((room) => room.id === "room-02");

      return {
        recordId,
        roomBefore,
        roomExpected,
        localDraftAfterClear,
        reloadedSavedRoom,
        reloadedExportedRoom
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

async function readExportedJson(browser) {
  const raw = await browser.evaluate(`document.querySelector('textarea[aria-label="Floorplan JSON"]')?.value ?? ''`);
  return JSON.parse(raw);
}

async function draftBannerText(browser) {
  return browser.evaluate(`document.querySelector('.layout-draft-recovery-banner')?.textContent ?? ''`);
}

async function editorStatusText(browser) {
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

function localDraftRoomExpression(recordId, roomId) {
  return `(() => {
    const draft = JSON.parse(localStorage.getItem(${JSON.stringify(localDraftKey(recordId))}) || 'null');
    return draft?.editableLayout?.rooms?.find((room) => room.id === ${JSON.stringify(roomId)}) ?? null;
  })()`;
}

function localDraftRoomPredicate(recordId, roomId, expectedXFeet) {
  return `(() => {
    const draft = JSON.parse(localStorage.getItem(${JSON.stringify(localDraftKey(recordId))}) || 'null');
    const room = draft?.editableLayout?.rooms?.find((candidate) => candidate.id === ${JSON.stringify(roomId)});
    return room?.xFeet === ${JSON.stringify(expectedXFeet)};
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
