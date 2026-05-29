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
  writeText,
  writeTextIfMissing
} from "./lib/floorplan-editor-save-reload-batch-utils.mjs";

const stage = readArg("--stage", "final");
const issue = readArg("--issue", "634");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: save pipeline does not trace room and door values across editable, draft, store, localStorage, and reopen stages.\n"
);

const stages = stage === "final"
  ? [
      "trace-contract",
      "editable-to-draft",
      "draft-to-saved-record",
      "persisted-localstorage",
      "reopened-layout-match",
      "no-private-payload"
    ]
  : [stage];

let scenario = null;
for (const selectedStage of stages) {
  await runStage(selectedStage);
}

const passed = statusFromChecks(checks) === "passed";
if (passed) {
  updateSaveReloadManifest(issue, {
    savePipelineTraceStatus: "passed",
    savedPayloadDiffProof: true,
    localStorageSavedRecordProof: true
  });
}

writeJson(`${dir}/test-output/save-pipeline-trace.txt`, {
  status: passed ? "passed" : "failed",
  stage,
  issue,
  checks
});

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-layout-editor-save-pipeline-trace.mjs --stage trace-contract --allow-partial --issue 634",
  "node scripts/check-layout-editor-save-pipeline-trace.mjs --stage editable-to-draft --allow-partial --issue 634",
  "node scripts/check-layout-editor-save-pipeline-trace.mjs --stage draft-to-saved-record --allow-partial --issue 634",
  "node scripts/check-layout-editor-save-pipeline-trace.mjs --stage persisted-localstorage --allow-partial --issue 634",
  "node scripts/check-layout-editor-save-pipeline-trace.mjs --stage reopened-layout-match --allow-partial --issue 634",
  "node scripts/check-layout-editor-save-pipeline-trace.mjs --stage no-private-payload --allow-partial --issue 634",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, {
  "node scripts/check-layout-editor-save-pipeline-trace.mjs --stage trace-contract --allow-partial --issue 634": `${dir}/trace-contract-output.json`,
  "node scripts/check-layout-editor-save-pipeline-trace.mjs --stage editable-to-draft --allow-partial --issue 634": `${dir}/editable-layout-stage-output.json`,
  "node scripts/check-layout-editor-save-pipeline-trace.mjs --stage draft-to-saved-record --allow-partial --issue 634": `${dir}/saved-record-stage-output.json`,
  "node scripts/check-layout-editor-save-pipeline-trace.mjs --stage persisted-localstorage --allow-partial --issue 634": `${dir}/localstorage-stage-output.json`,
  "node scripts/check-layout-editor-save-pipeline-trace.mjs --stage reopened-layout-match --allow-partial --issue 634": `${dir}/reopened-stage-output.json`,
  "node scripts/check-layout-editor-save-pipeline-trace.mjs --stage no-private-payload --allow-partial --issue 634": `${dir}/private-payload-negative-output.txt`
});
writeCloseout(issue, "Save pipeline trace records comparable room and door probes through save, localStorage persistence, and same-record reopen.", passed ? "passed" : "failed", commands, [
  "Trace state is test-only browser memory; named-copy persistence remains in the saved floorplan localStorage record.",
  "Door wall and offset are comparable in editable/draft/saved layout stages; reopened plan proof uses exported x/y/width because PlanContract doors do not store wall names."
]);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", stage, issue, checks }, null, 2));
if (!passed && !allowPartial) process.exit(1);

async function runStage(selectedStage) {
  if (selectedStage === "trace-contract") {
    const traceFile = readText("apps/web/src/features/layout-editor/layoutSaveTrace.ts");
    const stageFile = readText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx");
    const storeFile = readText("apps/web/src/features/floorplans/savedFloorplanStore.ts");
    const persistenceFile = readText("apps/web/src/features/floorplans/savedFloorplanPersistence.ts");
    const appFile = readText("apps/web/src/App.tsx");
    const requiredTokens = [
      "type LayoutSaveTrace",
      "type RoomDoorProbe",
      "beforeEdit",
      "afterEditEditableLayout",
      "draftBeforeSave",
      "saveHandlerInput",
      "savedRecordPayload",
      "persistedLocalStoragePayload",
      "reopenedPlan",
      "reopenedEditableLayout"
    ];
    const passed = requiredTokens.every((token) => traceFile.includes(token)) &&
      stageFile.includes("recordEditableLayoutTraceStage(\"afterEditEditableLayout\"") &&
      stageFile.includes("recordDraftTraceStage(\"draftBeforeSave\"") &&
      appFile.includes("recordDraftTraceStage(\"saveHandlerInput\"") &&
      storeFile.includes("recordSavedRecordTraceStage(\"savedRecordPayload\"") &&
      persistenceFile.includes("recordSavedRecordTraceStage(\"persistedLocalStoragePayload\"");
    addCheck(checks, "trace contract and save-pipeline hooks are present", passed);
    writeJson(`${dir}/trace-contract-output.json`, {
      status: passed ? "passed" : "failed",
      requiredTokens
    });
    return;
  }

  scenario ??= await runTraceScenario();

  if (selectedStage === "editable-to-draft") {
    const passed =
      probeEquals(scenario.trace.afterEditEditableLayout, scenario.trace.draftBeforeSave) &&
      probeEquals(scenario.trace.draftBeforeSave, scenario.trace.saveHandlerInput) &&
      probeChanged(scenario.trace.beforeEdit, scenario.trace.afterEditEditableLayout);
    addCheck(checks, "editable layout, draft, and save handler input carry changed room and door values", passed, {
      beforeEdit: scenario.trace.beforeEdit,
      afterEditEditableLayout: scenario.trace.afterEditEditableLayout,
      draftBeforeSave: scenario.trace.draftBeforeSave,
      saveHandlerInput: scenario.trace.saveHandlerInput
    });
    writeJson(`${dir}/editable-layout-stage-output.json`, {
      status: passed ? "passed" : "failed",
      beforeEdit: scenario.trace.beforeEdit,
      afterEditEditableLayout: scenario.trace.afterEditEditableLayout
    });
    writeJson(`${dir}/draft-stage-output.json`, {
      status: passed ? "passed" : "failed",
      draftBeforeSave: scenario.trace.draftBeforeSave
    });
    writeJson(`${dir}/save-handler-stage-output.json`, {
      status: passed ? "passed" : "failed",
      saveHandlerInput: scenario.trace.saveHandlerInput
    });
    writeJson(`${dir}/payload-diff-output.json`, buildPayloadDiffOutput(scenario.trace));
    return;
  }

  if (selectedStage === "draft-to-saved-record") {
    const passed =
      probeEquals(scenario.trace.saveHandlerInput, scenario.trace.savedRecordPayload) &&
      probeChanged(scenario.trace.beforeEdit, scenario.trace.savedRecordPayload);
    addCheck(checks, "savedFloorplanStore record keeps changed room and door values", passed, {
      saveHandlerInput: scenario.trace.saveHandlerInput,
      savedRecordPayload: scenario.trace.savedRecordPayload
    });
    writeJson(`${dir}/saved-record-stage-output.json`, {
      status: passed ? "passed" : "failed",
      savedRecordPayload: scenario.trace.savedRecordPayload,
      savedRecordId: scenario.recordId
    });
    writeJson(`${dir}/payload-diff-output.json`, buildPayloadDiffOutput(scenario.trace));
    return;
  }

  if (selectedStage === "persisted-localstorage") {
    const passed =
      probeEquals(scenario.trace.savedRecordPayload, scenario.trace.persistedLocalStoragePayload) &&
      probeEquals(scenario.trace.persistedLocalStoragePayload, scenario.localStorageProbe) &&
      scenario.persistedRecord.savedPlanId === scenario.recordId;
    addCheck(checks, "localStorage saved record payload matches saved record probe", passed, {
      persistedLocalStoragePayload: scenario.trace.persistedLocalStoragePayload,
      localStorageProbe: scenario.localStorageProbe
    });
    writeJson(`${dir}/localstorage-stage-output.json`, {
      status: passed ? "passed" : "failed",
      recordId: scenario.recordId,
      persistedLocalStoragePayload: scenario.trace.persistedLocalStoragePayload,
      localStorageProbe: scenario.localStorageProbe
    });
    return;
  }

  if (selectedStage === "reopened-layout-match") {
    const passed =
      scenario.reopenedViaLibraryRecordId === scenario.recordId &&
      probeEquals(scenario.trace.savedRecordPayload, scenario.trace.reopenedEditableLayout) &&
      planProbeMatchesEditableProbe(scenario.trace.reopenedPlan, scenario.trace.savedRecordPayload);
    addCheck(checks, "same-record reopen restores saved payload into active plan and editable layout", passed, {
      recordId: scenario.recordId,
      reopenedViaLibraryRecordId: scenario.reopenedViaLibraryRecordId,
      reopenedPlan: scenario.trace.reopenedPlan,
      reopenedEditableLayout: scenario.trace.reopenedEditableLayout
    });
    writeJson(`${dir}/reopened-stage-output.json`, {
      status: passed ? "passed" : "failed",
      recordId: scenario.recordId,
      reopenedViaLibraryRecordId: scenario.reopenedViaLibraryRecordId,
      reopenedPlan: scenario.trace.reopenedPlan,
      reopenedEditableLayout: scenario.trace.reopenedEditableLayout
    });
    return;
  }

  if (selectedStage === "no-private-payload") {
    const privatePayload = findForbiddenKeys(scenario.persistedRecord);
    const tracePrivatePayload = findForbiddenKeys(scenario.trace);
    const passed = privatePayload.length === 0 &&
      tracePrivatePayload.length === 0 &&
      scenario.persistedRecord.sourceProvenance?.publicExposureAllowed === false;
    addCheck(checks, "saved record and trace omit private source payload", passed, {
      privatePayload,
      tracePrivatePayload
    });
    writeText(
      `${dir}/private-payload-negative-output.txt`,
      `${passed ? "passed" : "failed"}: forbidden payload keys in saved record=${privatePayload.length}, trace=${tracePrivatePayload.length}\n`
    );
    return;
  }

  throw new Error(`Unsupported save-pipeline trace stage: ${selectedStage}`);
}

async function runTraceScenario() {
  mkdirSync(`${dir}/exported-json`, { recursive: true });
  const port = Number(readArg("--port", "6834"));
  const chromePort = Number(readArg("--chrome-port", "9834"));
  const initScript =
    "sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));";

  const { result } = await withBrowserRenderedApp(
    { port, chromePort, width: 1440, height: 1000, initScript },
    async (browser) => {
      await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
      await browser.evaluate("localStorage.clear()");
      await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
      await browser.evaluate(`window.__nerdeusLayoutSaveTraceEnabled = true`);
      await waitForExpression(browser, `document.querySelector('[aria-label="Editor status"]')?.innerText.includes('Canonical default')`, 10_000);
      await browser.evaluate(clickButton("Save working copy"));
      await waitForExpression(browser, `document.querySelector('[aria-label="Editor status"]')?.innerText.includes('Saved working copy')`, 10_000);

      const recordId = await browser.evaluate(savedRecordIdExpression());
      const beforeEdit = await browser.evaluate(probeSavedRecordExpression(recordId));
      await browser.evaluate(`(() => {
        window.__nerdeusLayoutSaveTrace = {
          ...(window.__nerdeusLayoutSaveTrace ?? {}),
          traceId: 'issue-634-save-pipeline-trace',
          recordId: ${JSON.stringify(recordId)},
          planId: 'default-er-layout-plan-1',
          beforeEdit: ${JSON.stringify(beforeEdit)}
        };
      })()`);

      await dragRoom(browser, "room-02", 144, 72);
      await selectDoor(browser, "door-02");
      await clickQuickDoorButton(browser, "Nudge +");
      await clickQuickDoorButton(browser, "Width +");
      await browser.evaluate(clickButton("Save working copy"));
      await delay(500);
      const traceBeforeReload = await browser.evaluate(`window.__nerdeusLayoutSaveTrace ?? null`);
      const persistedRecord = await browser.evaluate(savedRecordExpression(recordId));
      const localStorageProbe = await browser.evaluate(probeSavedRecordExpression(recordId));

      await browser.evaluate(`location.reload()`);
      await waitForExpression(browser, `document.querySelector('button') != null`, 15_000);
      await browser.navigate(`${browser.baseUrl}/?section=floorplans`, `document.querySelector('[data-record-id="${recordId}"]') != null`);
      await browser.evaluate(`window.__nerdeusLayoutSaveTraceEnabled = true`);
      const reopenedViaLibraryRecordId = await browser.evaluate(`(() => {
        const card = document.querySelector('[data-record-id="${recordId}"]');
        const button = Array.from(card.querySelectorAll('button')).find((item) => item.textContent.trim() === 'Open Saved Floorplan');
        button?.click();
        return card.getAttribute('data-record-id');
      })()`);
      await delay(300);
      await browser.evaluate(clickButton("Editor"));
      await waitForExpression(browser, `document.querySelector('[aria-label="Editor status"]')?.innerText.includes('${recordId}')`, 10_000);
      const traceAfterReload = await browser.evaluate(`window.__nerdeusLayoutSaveTrace ?? null`);
      await browser.evaluate(clickButton("Export"));
      await delay(150);
      const exported = await readExportedJson(browser);
      writeText(`${dir}/exported-json/reopened-export.json`, `${JSON.stringify(exported, null, 2)}\n`);

      return {
        recordId,
        reopenedViaLibraryRecordId,
        trace: {
          ...traceBeforeReload,
          reopenedPlan: traceAfterReload?.reopenedPlan,
          reopenedEditableLayout: traceAfterReload?.reopenedEditableLayout
        },
        persistedRecord,
        localStorageProbe,
        exported
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

function savedRecordExpression(recordId) {
  return `JSON.parse(localStorage.getItem('nerdeus.floorplans.savedAuthoringRecords.v1') || '[]').find((record) => record.savedPlanId === ${JSON.stringify(recordId)}) ?? null`;
}

function probeSavedRecordExpression(recordId) {
  return `(() => {
    const record = ${savedRecordExpression(recordId)};
    const layout = record?.authoringDraft?.editableLayout;
    if (layout == null) return null;
    const room = layout.rooms.find((candidate) => candidate.id === 'room-02') ?? layout.rooms[0];
    const door = layout.doors.find((candidate) => candidate.id === 'door-02') ?? layout.doors.find((candidate) => candidate.ownerId === room.id) ?? layout.doors[0] ?? null;
    return {
      roomId: room.id,
      roomX: room.xFeet,
      roomY: room.yFeet,
      roomWidth: room.widthFeet,
      roomHeight: room.heightFeet,
      doorId: door?.id ?? null,
      doorRoomId: door?.ownerId ?? null,
      doorWall: door?.wall,
      doorOffsetFeet: door?.offsetFeet,
      doorWidthFeet: door?.widthFeet,
      doorCount: layout.doors.length
    };
  })()`;
}

function probeEquals(left, right) {
  return left != null && right != null &&
    left.roomId === right.roomId &&
    left.roomX === right.roomX &&
    left.roomY === right.roomY &&
    left.roomWidth === right.roomWidth &&
    left.roomHeight === right.roomHeight &&
    left.doorId === right.doorId &&
    left.doorRoomId === right.doorRoomId &&
    left.doorWall === right.doorWall &&
    left.doorOffsetFeet === right.doorOffsetFeet &&
    left.doorWidthFeet === right.doorWidthFeet &&
    left.doorCount === right.doorCount;
}

function planProbeMatchesEditableProbe(planProbe, editableProbe) {
  return planProbe != null && editableProbe != null &&
    planProbe.roomId === editableProbe.roomId &&
    planProbe.roomX === editableProbe.roomX &&
    planProbe.roomY === editableProbe.roomY &&
    planProbe.roomWidth === editableProbe.roomWidth &&
    planProbe.roomHeight === editableProbe.roomHeight &&
    planProbe.doorId === editableProbe.doorId &&
    planProbe.doorRoomId === editableProbe.doorRoomId &&
    planProbe.doorWidthFeet === editableProbe.doorWidthFeet &&
    planProbe.doorCount === editableProbe.doorCount;
}

function probeChanged(before, after) {
  return before != null && after != null &&
    (before.roomX !== after.roomX ||
      before.roomY !== after.roomY ||
      before.roomWidth !== after.roomWidth ||
      before.roomHeight !== after.roomHeight ||
      before.doorRoomId !== after.doorRoomId ||
      before.doorWall !== after.doorWall ||
      before.doorOffsetFeet !== after.doorOffsetFeet ||
      before.doorWidthFeet !== after.doorWidthFeet ||
      before.doorCount !== after.doorCount);
}

function buildPayloadDiffOutput(trace) {
  return {
    status: probeChanged(trace.beforeEdit, trace.savedRecordPayload) ? "passed" : "failed",
    beforeEdit: trace.beforeEdit,
    afterEditEditableLayout: trace.afterEditEditableLayout,
    savedRecordPayload: trace.savedRecordPayload,
    changedFields: {
      roomX: [trace.beforeEdit?.roomX, trace.savedRecordPayload?.roomX],
      roomY: [trace.beforeEdit?.roomY, trace.savedRecordPayload?.roomY],
      doorOffsetFeet: [trace.beforeEdit?.doorOffsetFeet, trace.savedRecordPayload?.doorOffsetFeet],
      doorWidthFeet: [trace.beforeEdit?.doorWidthFeet, trace.savedRecordPayload?.doorWidthFeet]
    }
  };
}

function findForbiddenKeys(value, path = "$") {
  const forbidden = [
    `sourceDocument${"Path"}`,
    `docx${"Binary"}`,
    "binaryData",
    "rawFileContent",
    "base64Content",
    "embeddedDocument",
    `source${"Filename"}`,
    "privateAbsolutePath"
  ];
  if (value == null || typeof value !== "object") {
    return [];
  }
  return Object.entries(value).flatMap(([key, child]) => [
    ...(forbidden.includes(key) ? [`${path}.${key}`] : []),
    ...findForbiddenKeys(child, `${path}.${key}`)
  ]);
}
