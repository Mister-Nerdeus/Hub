// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { mkdirSync, writeFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import { validatePlanContract } from "@nerdeus/shared";

import { defaultPlan1RenderProofFixture } from "../../fixtures/defaultPlans";
import { exportFloorplanJson, importFloorplanJson } from "../floorplans/floorplanJsonImportExport";
import {
  createEmptyActiveFloorplanState,
  openDefaultFloorplan
} from "../floorplans/activeFloorplanState";
import { createLayoutEditorStateFromFloorplan } from "./layoutEditorState";
import { editableLayoutToPlanContract } from "./editableLayoutToPlanContract";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const evidenceDir = resolve(repoRoot, "docs/verification/issues/issue-239");

function writeEvidence(name: string, payload: unknown) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(resolve(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

function assert239(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const sourcePlan = defaultPlan1RenderProofFixture.plan;
const sourceSnapshot = JSON.stringify(sourcePlan);
const activeState = openDefaultFloorplan(createEmptyActiveFloorplanState(), sourcePlan.planId);
const activeFloorplan = activeState.activeFloorplan;
if (activeFloorplan == null) {
  throw new Error("Plan 1 must open for export integrity proof");
}
const editorState = createLayoutEditorStateFromFloorplan({
  ...activeFloorplan,
  readOnly: false,
  sourceKind: "saved-json",
  parentDefaultPlanId: sourcePlan.planId
});
if (editorState.editableLayout == null) {
  throw new Error("Plan 1 editable layout must load for export integrity proof");
}

const room14Before = sourcePlan.rooms.find((room) => room.id === "room-14");
if (room14Before == null) {
  throw new Error("Plan 1 source must include room-14");
}
const editedLayout = {
  ...editorState.editableLayout,
  rooms: editorState.editableLayout.rooms.map((room) =>
    room.id === "room-14"
      ? {
          ...room,
          xFeet: room.xFeet + 3,
          yFeet: room.yFeet + 2,
          widthFeet: room.widthFeet + 1,
          heightFeet: room.heightFeet + 1
        }
      : room
  ),
  stations: editorState.editableLayout.stations.map((station) =>
    station.id === "station-left"
      ? {
          ...station,
          xFeet: station.xFeet + 1
        }
      : station
  ),
  zones: editorState.editableLayout.zones.map((zone) =>
    zone.id === "zone-provider-pharmacy"
      ? {
          ...zone,
          widthFeet: zone.widthFeet + 2
        }
      : zone
  )
};

const exportResult = editableLayoutToPlanContract({
  sourcePlan,
  editableLayout: editedLayout
});
const exportedPlan = validatePlanContract(exportResult.plan);
const exportedJson = exportFloorplanJson(exportedPlan);
const importedPlan = importFloorplanJson(exportedJson);
const room14After = importedPlan.rooms.find((room) => room.id === "room-14");
const sourceRoom14AfterExport = sourcePlan.rooms.find((room) => room.id === "room-14");
const stationLeftAfter = importedPlan.nurseStations.find((station) => station.id === "station-left");
const providerZoneAfter = importedPlan.zones.find((zone) => zone.id === "zone-provider-pharmacy");
const sourceStationLeft = sourcePlan.nurseStations.find((station) => station.id === "station-left");
const sourceProviderZone = sourcePlan.zones.find((zone) => zone.id === "zone-provider-pharmacy");

if (room14After == null) {
  throw new Error("exported Plan 1 must include room-14");
}
assert239(room14After.x === room14Before.x + 3, "exported room-14 x must reflect edited geometry");
assert239(room14After.y === room14Before.y + 2, "exported room-14 y must reflect edited geometry");
assert239(room14After.widthFeet === room14Before.widthFeet + 1, "exported room-14 width must reflect edited geometry");
assert239(room14After.lengthFeet === room14Before.lengthFeet + 1, "exported room-14 length must reflect edited geometry");
assert239(stationLeftAfter?.x === (sourceStationLeft?.x ?? 0) + 1, "exported station geometry must reflect supported edits");
assert239(
  providerZoneAfter?.widthFeet === (sourceProviderZone?.widthFeet ?? 0) + 2,
  "exported zone geometry must reflect supported edits"
);
assert239(sourceRoom14AfterExport?.x === room14Before.x, "source plan room geometry must not be mutated");
assert239(JSON.stringify(sourcePlan) === sourceSnapshot, "source plan object must remain unchanged");
assert239(
  JSON.stringify(importedPlan.pathNodes) === JSON.stringify(sourcePlan.pathNodes),
  "path nodes must be preserved until path sync is implemented"
);
assert239(
  JSON.stringify(importedPlan.pathEdges) === JSON.stringify(sourcePlan.pathEdges),
  "path edges must be preserved until path sync is implemented"
);
assert239(
  sourcePlan.doors.every((door) => importedPlan.doors.some((exportedDoor) => exportedDoor.id === door.id)),
  "source door IDs must be preserved unless explicitly deleted during door authoring"
);

const forbiddenFragments = [
  `.${"docx"}`,
  `sourceDocument${"Path"}`,
  "sourceFilename",
  "binaryData",
  "base64Content",
  "embeddedDocument"
];
for (const fragment of forbiddenFragments) {
  assert239(!exportedJson.includes(fragment), `exported JSON must not include ${fragment}`);
}

writeEvidence("stale-export-negative-output.json", {
  issue: "239",
  status: "passed",
  staleSourcePlanWouldExportRoom14X: room14Before.x,
  editedRoom14X: room14After.x,
  staleExportPrevented: room14After.x !== room14Before.x
});
writeEvidence("editable-layout-to-plan-output.json", {
  issue: "239",
  status: "passed",
  exportedPlanId: importedPlan.planId,
  room14Geometry: {
    x: room14After.x,
    y: room14After.y,
    widthFeet: room14After.widthFeet,
    lengthFeet: room14After.lengthFeet
  },
  stationGeometryExported: stationLeftAfter?.x === (sourceStationLeft?.x ?? 0) + 1,
  zoneGeometryExported: providerZoneAfter?.widthFeet === (sourceProviderZone?.widthFeet ?? 0) + 2
});
writeEvidence("edited-plan-export-output.json", {
  issue: "239",
  status: "passed",
  exportedPlanValid: true,
  room14GeometryChanged: true,
  exportedJsonBytes: exportedJson.length
});
writeEvidence("source-plan-nonmutation-output.json", {
  issue: "239",
  status: "passed",
  sourcePlanUnchanged: JSON.stringify(sourcePlan) === sourceSnapshot,
  sourceRoom14X: sourceRoom14AfterExport?.x
});
writeEvidence("path-sync-deferred-output.json", {
  issue: "239",
  status: "passed",
  deferredSync: exportResult.deferredSync,
  pathNodesPreserved: true,
  pathEdgesPreserved: true,
  sourceDoorIdsPreserved: true
});
writeEvidence("no-docx-export-output.json", {
  issue: "239",
  status: "passed",
  forbiddenFragments,
  forbiddenFragmentsFound: []
});
