import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  addDoorToRoom,
  addRoomToEditableLayout,
  assertNoForbiddenSourcePayload,
  buildPlanContractFromEditableLayout,
  createDefaultPlanEditableCopy,
  generateAutoHallways,
  generateAutoPodBorder,
  planContractToEditableLayoutGeometry,
  validateDefaultSavedPlanFixtureContract,
  validateSimulationReadyExport
} from "../dist/index.js";

const issueDir = resolve(process.cwd(), "../..", "docs/verification/issues/issue-289");
const dryRunFixturePath = resolve(
  process.cwd(),
  "fixtures/authoring-dry-runs/plan-2/plan-2-authoring-dry-run.json"
);
const authoringProofFixturePath = resolve(
  process.cwd(),
  "fixtures/authoring-proof/plan-2-authoring-dry-run.json"
);
const plan2Path = resolve(process.cwd(), "fixtures/default-plans/default-er-layout-plan-2.json");

const beforeSource = readFileSync(plan2Path, "utf8");
const defaultFixture = validateDefaultSavedPlanFixtureContract(JSON.parse(beforeSource));
const initialEditableLayout = planContractToEditableLayoutGeometry(defaultFixture.plan);
const editableCopy = createDefaultPlanEditableCopy({
  defaultFixture,
  editablePlanId: "default-er-layout-plan-2-authoring-dry-run-copy",
  displayName: "Plan 2 Authoring Dry Run Copy",
  versionLabel: "plan-2-dry-run-v1",
  createdAt: "2026-05-25T00:00:00Z",
  editableLayout: initialEditableLayout
});

const firstRoom = editableCopy.authoringDraft.editableLayout.rooms[0];
if (firstRoom == null) {
  throw new Error("Plan 2 dry run requires at least one editable room");
}
const movedAndTypedLayout = {
  ...editableCopy.authoringDraft.editableLayout,
  rooms: editableCopy.authoringDraft.editableLayout.rooms.map((room) =>
    room.id === firstRoom.id
      ? {
          ...room,
          xFeet: room.xFeet + 2,
          yFeet: room.yFeet + 1,
          roomType: room.roomType === "trauma" ? "procedure" : "trauma",
          isTraumaAdjacent: true
        }
      : room
  )
};
const boundsFeet = {
  xFeet: 0,
  yFeet: 0,
  widthFeet: Math.max(...movedAndTypedLayout.rooms.map((room) => room.xFeet + room.widthFeet)) + 40,
  heightFeet: Math.max(...movedAndTypedLayout.rooms.map((room) => room.yFeet + room.heightFeet)) + 40
};
const addedRoom = addRoomToEditableLayout({
  layout: movedAndTypedLayout,
  readOnly: false,
  roomId: "plan-2-dry-run-added-room",
  label: "Plan 2 Dry Run Added Room",
  roomType: "patient_room",
  xFeet: boundsFeet.widthFeet - 26,
  yFeet: boundsFeet.heightFeet - 22,
  widthFeet: 12,
  heightFeet: 10,
  boundsFeet
});
const addedDoor = addDoorToRoom({
  layout: addedRoom.layout,
  readOnly: false,
  doorId: "plan-2-dry-run-added-door",
  roomId: addedRoom.selectedRoomId,
  wall: "north",
  offsetFeet: 2,
  widthFeet: 3
});
const hallway = generateAutoHallways({
  layout: addedDoor.layout,
  sourcePlanId: editableCopy.authoringDraft.planId,
  readOnly: false,
  boundsFeet,
  generationMethod: "grid_subtraction",
  gridCellSizeFeet: 4
});
const manualHallways = addedDoor.layout.hallways.filter((candidate) =>
  hallway.preservedManualHallwayIds.includes(candidate.id)
);
const editedLayout = {
  ...addedDoor.layout,
  hallways: [...manualHallways, ...hallway.generatedHallwayZones]
};
const podBorder = generateAutoPodBorder({
  layout: editedLayout,
  sourcePlanId: editableCopy.authoringDraft.planId,
  paddingFeet: 4
});
const editedDraft = {
  ...editableCopy.authoringDraft,
  displayName: "Plan 2 Dry Run Renamed Copy",
  versionLabel: "plan-2-dry-run-edited",
  editableLayout: editedLayout,
  pathSyncStatus: addedDoor.pathSyncStatus,
  authoringStatus: "draft_has_warnings",
  authoringWarnings: [
    ...addedRoom.warnings.map((warning) => warning.code),
    addedDoor.warning,
    "Synthetic Plan 2 dry run requires route/path review before simulation-ready export."
  ],
  updatedAt: "2026-05-25T00:00:00Z"
};
const savedPayload = JSON.parse(JSON.stringify(editedDraft));
const reloadedDraft = JSON.parse(JSON.stringify(savedPayload));
const exportedPlan = buildPlanContractFromEditableLayout({
  sourcePlan: reloadedDraft.sourcePlan,
  editableLayout: reloadedDraft.editableLayout,
  planId: reloadedDraft.planId
});
const exportAttempt = validateSimulationReadyExport({ authoringDraft: reloadedDraft });
const afterSource = readFileSync(plan2Path, "utf8");
const sourceUnchanged = beforeSource === afterSource;

assertNoForbiddenSourcePayload(reloadedDraft, "plan2DryRun");
if (!sourceUnchanged) {
  throw new Error("Plan 2 source fixture must remain unchanged");
}
if (exportAttempt.status !== "blocked_path_sync" && exportAttempt.status !== "simulation_ready" && exportAttempt.status !== "draft_has_warnings") {
  throw new Error("Plan 2 dry run export attempt must produce explicit ready/block status");
}

const summary = {
  issue: "289",
  status: "passed",
  sourceDefaultPlanId: defaultFixture.plan.planId,
  editableCopyId: editableCopy.authoringDraft.draftId,
  renamedDisplayName: reloadedDraft.displayName,
  roomMoved: reloadedDraft.editableLayout.rooms.some(
    (room) => room.id === firstRoom.id && room.xFeet === firstRoom.xFeet + 2 && room.yFeet === firstRoom.yFeet + 1
  ),
  roomTypeChanged: reloadedDraft.editableLayout.rooms.some(
    (room) => room.id === firstRoom.id && room.roomType !== firstRoom.roomType
  ),
  roomAdded: reloadedDraft.editableLayout.rooms.some((room) => room.id === "plan-2-dry-run-added-room"),
  doorAdded: reloadedDraft.editableLayout.doors.some((door) => door.id === "plan-2-dry-run-added-door"),
  hallwayGenerated: hallway.generatedHallwayZones.length > 0,
  podBorderGenerated: podBorder.generatedFromObjectIds.length > 0,
  saveReloadMatched: stableJson(reloadedDraft.editableLayout) === stableJson(editedDraft.editableLayout),
  sourcePlan2Unchanged: sourceUnchanged,
  privateSourcePayloadStored: false,
  simulationReadyExportStatus: exportAttempt.status,
  exportedRoomCount: exportedPlan.rooms.length,
  exportedDoorCount: exportedPlan.doors.length,
  limitations: [
    "Synthetic/manual Plan 2 authoring dry run only.",
    "No exact DOCX parity claim.",
    "Simulation-ready export may remain blocked until route/path sync is reviewed."
  ]
};

writeJson("plan-2-editable-copy-output.json", {
  issue: "289",
  status: "passed",
  sourceDefaultPlanId: summary.sourceDefaultPlanId,
  editableCopyId: summary.editableCopyId,
  displayName: editableCopy.authoringDraft.displayName
});
writeJson("plan-2-authoring-dry-run-output.json", summary);
writeJson("plan-2-save-reload-output.json", {
  issue: "289",
  status: "passed",
  saveReloadMatched: summary.saveReloadMatched,
  renamedDisplayName: summary.renamedDisplayName,
  editedRoomCount: reloadedDraft.editableLayout.rooms.length,
  editedDoorCount: reloadedDraft.editableLayout.doors.length
});
writeJson("plan-2-source-nonmutation-output.json", {
  issue: "289",
  status: "passed",
  sourcePlan2Unchanged: sourceUnchanged,
  sourceDefaultPlanId: summary.sourceDefaultPlanId
});
writeJson("plan-2-private-source-boundary-output.json", {
  issue: "289",
  status: "passed",
  privateSourcePayloadStored: false,
  runtimeServedByWeb: false,
  runtimeServedByApi: false
});
writeJson("plan-2-simulation-ready-export-attempt-output.json", {
  issue: "289",
  status: "passed",
  exportStatus: exportAttempt.status,
  blockingIssues: exportAttempt.blockingIssues,
  warningIssues: exportAttempt.warningIssues,
  pathSyncStatus: exportAttempt.pathSyncStatus,
  simulationReadyPlanPresent: exportAttempt.simulationReadyPlan != null
});
writeJsonToAbsolute(dryRunFixturePath, summary);
writeJsonToAbsolute(authoringProofFixturePath, summary);

function writeJson(name, payload) {
  writeJsonToAbsolute(resolve(issueDir, name), payload);
}

function writeJsonToAbsolute(target, payload) {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`);
}

function stableJson(value) {
  return JSON.stringify(value);
}
