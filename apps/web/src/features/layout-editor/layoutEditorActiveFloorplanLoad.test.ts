// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { mkdirSync, writeFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import { defaultPlanFixtures } from "../../fixtures/defaultPlans";
import {
  createEmptyActiveFloorplanState,
  openDefaultFloorplan,
  openSavedFloorplan
} from "../floorplans/activeFloorplanState";
import { createDuplicateFloorplanViewModel } from "../floorplans/duplicateFloorplanViewModel";
import { createSavedFloorplanStore } from "../floorplans/savedFloorplanStore";
import { buildHallwayZoneQuickEdit } from "./hallwayZoneQuickEditViewModel";
import { layoutEditorReducer } from "./layoutEditorReducer";
import { createLayoutEditorStateFromFloorplan } from "./layoutEditorState";
import { buildLayoutValidationPanelViewModel } from "./layoutValidationPanelViewModel";
import { buildLayoutValidationWarning } from "./layoutValidationWarningContract";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const evidenceDir = resolve(repoRoot, "docs/verification/issues/issue-223");

function writeEvidence(name: string, payload: unknown) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(resolve(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

const defaultFixture = defaultPlanFixtures[0];
if (defaultFixture == null) {
  throw new Error("expected at least one default floorplan fixture");
}

const defaultActiveState = openDefaultFloorplan(
  createEmptyActiveFloorplanState(),
  defaultFixture.plan.planId
);
const defaultFloorplan = defaultActiveState.activeFloorplan;
if (defaultFloorplan == null) {
  throw new Error("expected default active floorplan");
}

const defaultEditorState = createLayoutEditorStateFromFloorplan(defaultFloorplan);
if (defaultEditorState.readOnly !== true) {
  throw new Error("default floorplan editor state must be read-only");
}
if (defaultEditorState.editableLayout?.rooms.length !== defaultFixture.plan.rooms.length) {
  throw new Error("editor must load default floorplan rooms");
}
if (defaultEditorState.editableLayout.hallways.length !== defaultFixture.plan.hallways.length) {
  throw new Error("editor must load default floorplan hallways");
}
if (defaultEditorState.sourcePlan?.pathNodes.length !== defaultFixture.plan.pathNodes.length) {
  throw new Error("editor state must preserve path nodes from the source JSON plan");
}
if (defaultEditorState.sourcePlan.pathEdges.length !== defaultFixture.plan.pathEdges.length) {
  throw new Error("editor state must preserve path edges from the source JSON plan");
}
if (defaultEditorState.loadedFloorplan?.sourceKind !== "default-json") {
  throw new Error("editor loaded floorplan must identify default JSON source");
}
const supportAccessEligibleZoneIds = defaultEditorState.editableLayout.zones
  .filter((zone) =>
    buildHallwayZoneQuickEdit({
      hallway: null,
      zone,
      readOnly: false,
      validationWarningCount: 0
    }).canAddSupportAccessPoint
  )
  .map((zone) => zone.id);
if (!supportAccessEligibleZoneIds.includes("zone-provider-pharmacy")) {
  throw new Error("provider/pharmacy zone must expose support-access authoring");
}
if (supportAccessEligibleZoneIds.some((zoneId) => !/pharmacy/u.test(zoneId))) {
  throw new Error("support-access authoring must stay hidden on non-provider/pharmacy zones");
}
if (!defaultEditorState.editableLayout.zones.some((zone) => zone.zoneType === "operational")) {
  throw new Error("generic operational zones must not be mapped to provider/pharmacy");
}

const defaultFirstRoom = defaultEditorState.editableLayout.rooms[0];
if (defaultFirstRoom == null) {
  throw new Error("expected default editor room");
}
const readOnlyMoveAttempt = layoutEditorReducer(defaultEditorState, {
  type: "moveRoom",
  roomId: defaultFirstRoom.id,
  deltaXFeet: 4,
  deltaYFeet: 0
});
if (readOnlyMoveAttempt.editableLayout?.rooms[0]?.xFeet !== defaultFirstRoom.xFeet) {
  throw new Error("read-only default floorplans must refuse direct room edits");
}
if (readOnlyMoveAttempt.isDirty !== false || readOnlyMoveAttempt.editAuditTrail.length !== 0) {
  throw new Error("read-only default floorplan edit attempts must not dirty editor state");
}

const duplicate = createDuplicateFloorplanViewModel(defaultFixture.plan.planId).copy;
const store = createSavedFloorplanStore();
const saved = store.save(duplicate);
const savedActiveState = openSavedFloorplan(createEmptyActiveFloorplanState(), saved);
const savedFloorplan = savedActiveState.activeFloorplan;
if (savedFloorplan == null) {
  throw new Error("expected saved active floorplan");
}
const editableEditorState = createLayoutEditorStateFromFloorplan(savedFloorplan);
if (editableEditorState.readOnly !== false) {
  throw new Error("saved floorplan editor state must be editable");
}
const editableFirstRoom = editableEditorState.editableLayout?.rooms[0];
if (editableFirstRoom == null) {
  throw new Error("expected editable editor room");
}
const editedState = layoutEditorReducer(editableEditorState, {
  type: "moveRoom",
  roomId: editableFirstRoom.id,
  deltaXFeet: 2,
  deltaYFeet: 0
});
if (editedState.editableLayout?.rooms[0]?.xFeet !== editableFirstRoom.xFeet + 2) {
  throw new Error("editable saved floorplan must allow draft room edits");
}
if (editedState.isDirty !== true || editedState.editAuditTrail.length !== 1) {
  throw new Error("editable saved floorplan edits must dirty editor state with audit trail");
}

const warningState = layoutEditorReducer(editableEditorState, {
  type: "setValidationWarnings",
  validationWarnings: [
    buildLayoutValidationWarning({
      code: "editor-active-floorplan-proof",
      severity: "info",
      source: "audit",
      message: "Editor loaded active JSON floorplan.",
      objectType: "room",
      objectId: editableFirstRoom.id,
      isGenerated: false
    })
  ]
});
const validationPanel = buildLayoutValidationPanelViewModel({
  warnings: warningState.validationWarnings
});
if (validationPanel.warningCount !== 1 || validationPanel.status !== "warnings") {
  throw new Error("existing layout validation panel behavior must still run");
}

const serializedEditorState = JSON.stringify({
  defaultEditorState,
  editableEditorState,
  editedState
});
const prohibitedFragments = [
  `.${"docx"}`,
  `docs/${"floorplans"}`,
  `sourceDocument${"Path"}`,
  "sourceFilename",
  "download",
  "preview link"
];
for (const fragment of prohibitedFragments) {
  if (serializedEditorState.includes(fragment)) {
    throw new Error(`editor state must not expose ${fragment}`);
  }
}

writeEvidence("editor-loads-active-floorplan-output.json", {
  issue: "223",
  status: "passed",
  defaultPlanId: defaultEditorState.loadedFloorplan?.planId,
  savedPlanId: editableEditorState.loadedFloorplan?.planId,
  defaultRoomsLoaded: defaultEditorState.editableLayout.rooms.length,
  savedRoomsLoaded: editableEditorState.editableLayout?.rooms.length
});

writeEvidence("read-only-default-guard-output.json", {
  issue: "223",
  status: "passed",
  readOnlyDefault: defaultEditorState.readOnly,
  editAttemptChangedGeometry: false,
  editAttemptDirtyState: readOnlyMoveAttempt.isDirty
});

writeEvidence("editable-copy-editor-output.json", {
  issue: "223",
  status: "passed",
  savedRecordId: saved.recordId,
  editableCopyReadOnly: editableEditorState.readOnly,
  editChangedGeometry: true,
  editAuditEntries: editedState.editAuditTrail.length,
  validationPanelStatus: validationPanel.status
});

writeEvidence("metadata-preservation-output.json", {
  issue: "223",
  status: "passed",
  sourcePlanPreserved: true,
  rooms: editableEditorState.sourcePlan?.rooms.length,
  hallways: editableEditorState.sourcePlan?.hallways.length,
  doors: editableEditorState.sourcePlan?.doors.length,
  nurseStations: editableEditorState.sourcePlan?.nurseStations.length,
  zones: editableEditorState.sourcePlan?.zones.length,
  pathNodes: editableEditorState.sourcePlan?.pathNodes.length,
  pathEdges: editableEditorState.sourcePlan?.pathEdges.length,
  prohibitedFragments,
  privateDocumentExposureFound: false
});
