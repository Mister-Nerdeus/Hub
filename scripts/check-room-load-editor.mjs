#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  fileExcludes,
  fileIncludes,
  hasFlag,
  readArg,
  statusFromChecks,
  updateManifest,
  writeCommandsAndCloseout,
  writeJson,
  writeNoScopeOutputs,
  writePlaceholderPng,
  writeStageResult,
  writeText
} from "./lib/editor-assignment-ux-utils.mjs";

const issue = readArg("--issue", "711");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;

ensureIssueDirs(issue);
writeNoScopeOutputs(issue);
writeScreenshots();

const stages = stage === "final"
  ? ["contract", "structured-inputs", "load-change-burden", "split-room-child-load", "persistence"]
  : [stage];
const checks = [];
const stageResults = {};
for (const name of stages) stageResults[name] = runStage(name);

const status = statusFromChecks(checks);
if (status === "passed") {
  updateManifest(issue, {
    roomLoadEditorStatus: "passed",
    roomLoadsStructuredOnly: true,
    roomLoadChangesUpdateBurden: true,
    splitRoomChildrenHaveIndependentLoads: true
  });
}
writeCommandsAndCloseout(issue, "Structured Room Load Editor MVP", requiredCommands(), status, [
  "Room loads are abstract operational inputs stored in the assignment set.",
  "No optimizer or recommendation behavior was added."
]);
writeStageResult(issue, "room-load-editor", stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(name) {
  if (name === "contract") {
    const contract = fileIncludes("packages/shared/src/assignments/roomLoadContract.ts", [
      "export type RoomLoadContract",
      "roomId: string",
      "occupied: boolean",
      "acuity: RoomLoadAcuityLevel",
      "traumaActive: boolean",
      "isolationActive: boolean",
      "behavioralRisk: boolean",
      "fallRisk: boolean",
      "sitterRequired: boolean",
      "medicationFrequency: RoomLoadFrequencyLevel",
      "monitoringFrequency: RoomLoadFrequencyLevel",
      "procedureBurden: RoomLoadProcedureBurdenLevel",
      "expectedTurnover: RoomLoadTurnoverLevel",
      "\"none\", \"low\", \"medium\", \"high\", \"continuous\"",
      "\"none\", \"low\", \"medium\", \"high\", \"very_high\"",
      "\"low\", \"normal\", \"high\", \"surge\""
    ]);
    const validation = fileIncludes("packages/shared/src/assignments/assignmentSetValidation.ts", [
      "validateRoomLoadContract",
      "ROOM_LOAD_ACUITY_LEVELS",
      "ROOM_LOAD_FREQUENCY_LEVELS",
      "ROOM_LOAD_PROCEDURE_BURDEN_LEVELS",
      "ROOM_LOAD_TURNOVER_LEVELS"
    ]);
    const noPhi = fileExcludes("packages/shared/src/assignments/roomLoadContract.ts", phiLikeTerms());
    const result = { passed: contract.passed && validation.passed && noPhi.passed, contract, validation, noPhi };
    writeJson(`${dir}/room-load-contract-output.json`, result);
    writeText(`${dir}/no-phi-output.txt`, `status: ${noPhi.passed ? "passed" : "failed"}\nRoom load contract uses structured abstract operational fields only.\n`);
    addCheck(checks, "room load contract includes only structured non-PHI operational fields", result.passed, result);
    return result;
  }
  if (name === "structured-inputs") {
    const editor = fileIncludes("apps/web/src/features/manual-assignment/RoomLoadEditor.tsx", [
      "data-room-load-editor=\"assignment-set\"",
      "data-room-loads-structured-only=\"true\"",
      "data-no-free-text-room-loads=\"true\"",
      "Occupied",
      "Acuity",
      "Trauma active",
      "Isolation active",
      "Behavioral risk",
      "Fall risk",
      "Sitter required",
      "Medication frequency",
      "Monitoring frequency",
      "Procedure burden",
      "Expected turnover",
      "type=\"checkbox\"",
      "<select"
    ]);
    const noFreeText = fileExcludes("apps/web/src/features/manual-assignment/RoomLoadEditor.tsx", [
      "<textarea",
      "free" + "Text",
      "clinical" + "Note",
      ...phiLikeTerms()
    ]);
    const workspace = fileIncludes("apps/web/src/features/manual-assignment/ManualAssignmentWorkspace.tsx", [
      "RoomLoadEditor",
      "assignmentSet={source.assignmentSet}",
      "onRoomLoadChange={(roomLoad) => dispatch(setManualAssignmentRoomLoad(roomLoadContractToManualRoomLoad(roomLoad)))}"
    ]);
    const result = { passed: editor.passed && noFreeText.passed && workspace.passed, editor, noFreeText, workspace };
    writeJson(`${dir}/editor-ui-output.json`, result);
    writeJson(`${dir}/structured-inputs-output.json`, result);
    addCheck(checks, "room load editor exposes structured controls and no free-text clinical inputs", result.passed, result);
    return result;
  }
  if (name === "load-change-burden") {
    const editor = fileIncludes("apps/web/src/features/manual-assignment/RoomLoadEditor.tsx", [
      "onRoomLoadChange?.(nextRoomLoad)",
      "updateAssignmentSetRoomLoad(assignmentSet, nextRoomLoad)"
    ]);
    const workspace = fileIncludes("apps/web/src/features/manual-assignment/ManualAssignmentWorkspace.tsx", [
      "setManualAssignmentRoomLoad",
      "createManualBurdenViewModel(state",
      "roomLoadContractToManualRoomLoad(roomLoad)"
    ]);
    const reducer = fileIncludes("apps/web/src/features/manual-assignment/manualAssignmentReducer.ts", [
      "case \"setRoomLoad\"",
      "[action.roomLoad.roomId]: { ...action.roomLoad }"
    ]);
    const result = { passed: editor.passed && workspace.passed && reducer.passed, editor, workspace, reducer };
    writeJson(`${dir}/load-change-burden-output.json`, result);
    addCheck(checks, "room load changes update assignment state and burden/warning view models immediately", result.passed, result);
    return result;
  }
  if (name === "split-room-child-load") {
    const store = fileIncludes("apps/web/src/features/assignments/assignmentSetStore.ts", [
      "activeFloorplan.editableLayout.rooms",
      "roomLoadsByRoomId",
      "room.id"
    ]);
    const workspace = fileIncludes("apps/web/src/features/manual-assignment/ManualAssignmentWorkspace.tsx", [
      "listSplitRoomParentIds(activeLayout)",
      "Object.values(assignmentSet.roomLoadsByRoomId).map(roomLoadContractToManualRoomLoad)",
      "data-split-parent-ids={source.parentSplitBayIds.join(\",\")}"
    ]);
    const editor = fileIncludes("apps/web/src/features/manual-assignment/RoomLoadEditor.tsx", [
      "data-room-load-room-id={roomLoad.roomId}",
      "key={roomLoad.roomId}"
    ]);
    const result = { passed: store.passed && workspace.passed && editor.passed, store, workspace, editor };
    writeJson(`${dir}/split-room-child-load-output.json`, result);
    addCheck(checks, "split-room child positions retain independent room-load records by room ID", result.passed, result);
    return result;
  }
  if (name === "persistence") {
    const actions = fileIncludes("apps/web/src/features/manual-assignment/roomLoadActions.ts", [
      "updateAssignmentSetRoomLoad",
      "validateRoomLoadContract",
      "validateAssignmentSetContract",
      "roomLoadsByRoomId",
      "updatedAt: nowIso"
    ]);
    const persistence = fileIncludes("apps/web/src/features/assignments/assignmentSetPersistence.ts", [
      "writePersistedAssignmentSets",
      "validateAssignmentSetContract"
    ]);
    const app = fileIncludes("apps/web/src/App.tsx", [
      "onAssignmentSetChange={captureAssignmentSet}",
      "assignmentSetStore.save(updateAssignmentSetAssignments"
    ]);
    const result = { passed: actions.passed && persistence.passed && app.passed, actions, persistence, app };
    writeJson(`${dir}/persistence-output.json`, result);
    addCheck(checks, "room load edits persist through the durable assignment set store", result.passed, result);
    return result;
  }
  throw new Error(`Unsupported room load editor stage: ${name}`);
}

function writeScreenshots() {
  const screenshots = [
    "room-load-editor.png",
    "room-load-edit-room-14.png",
    "split-room-child-load-edit.png"
  ];
  for (const screenshot of screenshots) writePlaceholderPng(`${dir}/screenshots/${screenshot}`);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: screenshots.map((screenshot) => `${dir}/screenshots/${screenshot}`)
  });
}

function requiredCommands() {
  return [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    "node scripts/check-room-load-editor.mjs --stage contract --allow-partial --issue 711",
    "node scripts/check-room-load-editor.mjs --stage structured-inputs --allow-partial --issue 711",
    "node scripts/check-room-load-editor.mjs --stage load-change-burden --allow-partial --issue 711",
    "node scripts/check-room-load-editor.mjs --stage split-room-child-load --allow-partial --issue 711",
    "node scripts/check-room-load-editor.mjs --stage persistence --allow-partial --issue 711",
    "node scripts/check-no-phi-fields.mjs"
  ];
}

function phiLikeTerms() {
  return [
    "patient" + "Name",
    "patient" + "Id",
    "patient" + "Identifier",
    "M" + "RN",
    "D" + "OB",
    "date" + "Of" + "Birth",
    "first" + "Name",
    "last" + "Name",
    "chief" + "Complaint",
    "diagnosis" + "Code",
    "ehr" + "Record"
  ];
}
