#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const REQUIRED_STAGES = new Set([
  "room-type-contract",
  "trauma-storage-correction",
  "gray-presentation",
  "solid-wall-no-doors",
  "assignment-exclusion",
  "capacity-ratio-exclusion",
  "room-load-exclusion",
  "add-object-placement",
  "path-graph-blocking",
  "legacy-invalid-layouts",
  "visual-dom-proof",
  "final"
]);

const args = parseArgs(process.argv.slice(2));
const stage = args.stage;
if (!REQUIRED_STAGES.has(stage)) {
  fail(`--stage must be one of ${[...REQUIRED_STAGES].join(", ")}`);
}
const issue = args.issue ?? "unknown";
const manifest = readJson("docs/verification/room-type-semantics-manifest.json");
const allowPartial = args["allow-partial"] === true;

const checks = [];
const add = (name, passed, detail) => checks.push({ name, passed, detail });

add("product display name", manifest.productDisplayName === "ER Pod Shift Simulator", manifest.productDisplayName);
add("single canonical floorplan model", manifest.floorplanModelStatus === "single_canonical_floorplan", manifest.floorplanModelStatus);
add("storage room type exists", manifest.storageRoomTypeExists === true, manifest.storageRoomTypeExists);
add("solid wall room type exists", manifest.solidWallRoomTypeExists === true, manifest.solidWallRoomTypeExists);
add("storage is not assignable", manifest.storageAssignable === false, manifest.storageAssignable);
add("solid wall is not assignable", manifest.solidWallAssignable === false, manifest.solidWallAssignable);
add("storage is not ratio-counting", manifest.storageCountsTowardRatio === false, manifest.storageCountsTowardRatio);
add("solid wall is not ratio-counting", manifest.solidWallCountsTowardRatio === false, manifest.solidWallCountsTowardRatio);
add("solid wall does not accept doors", manifest.solidWallAcceptsDoors === false, manifest.solidWallAcceptsDoors);
add("no optimizer started", manifest.optimizerStatus === "not_started", manifest.optimizerStatus);
add("no full shift simulation started", manifest.fullShiftSimulationStatus === "not_started", manifest.fullShiftSimulationStatus);
add("no 4:1 scenario execution started", manifest.fourToOneScenarioStatus === "not_started", manifest.fourToOneScenarioStatus);
add("no 3:1 scenario execution started", manifest.threeToOneScenarioStatus === "not_started", manifest.threeToOneScenarioStatus);
add("manual approval missing", manifest.manualApprovalStatus === "missing", manifest.manualApprovalStatus);
add("promotion blocked", manifest.promotionStatus === "blocked", manifest.promotionStatus);
add("no PHI status passed", manifest.noPhiStatus === "passed", manifest.noPhiStatus);

if (stage === "room-type-contract" || stage === "final") {
  const contracts = fs.readFileSync("packages/shared/src/contracts.ts", "utf8");
  const editable = fs.readFileSync("packages/shared/src/layout-editor/editableLayoutGeometryContract.ts", "utf8");
  const rules = fs.readFileSync("packages/shared/src/floorplans/roomTypeRules.ts", "utf8");
  add("contracts include storage", contracts.includes('"storage"'), "contracts.ts");
  add("contracts include solid_wall", contracts.includes('"solid_wall"'), "contracts.ts");
  add("editable contract includes storage", editable.includes('"storage"'), "editableLayoutGeometryContract.ts");
  add("editable contract includes solid_wall", editable.includes('"solid_wall"'), "editableLayoutGeometryContract.ts");
  add("central storage rules exclude assignment", /storage:[\s\S]*nurseAssignable:\s*false/.test(rules), "roomTypeRules.ts");
  add("central storage rules exclude ratio", /storage:[\s\S]*ratioCountEligible:\s*false/.test(rules), "roomTypeRules.ts");
  add("central storage rules exclude room load", /storage:[\s\S]*roomLoadEligible:\s*false/.test(rules), "roomTypeRules.ts");
  add("central solid wall rules block doors", /solid_wall:[\s\S]*doorEligible:\s*false/.test(rules), "roomTypeRules.ts");
  add("central solid wall rules block path nodes", /solid_wall:[\s\S]*pathNodeEligible:\s*false/.test(rules), "roomTypeRules.ts");
  add("central solid wall rules block travel", /solid_wall:[\s\S]*travelBlocking:\s*true/.test(rules), "roomTypeRules.ts");
}

if (stage === "trauma-storage-correction" || stage === "final") {
  const fixture = readJson("packages/shared/fixtures/default-plans/default-er-layout-plan-1.json");
  const room = fixture.plan.rooms.find((candidate) => candidate.id === "room-14");
  const trauma = fixture.plan.rooms.find((candidate) => candidate.id === "room-level-1-trauma");
  add("canonical Trauma One rear object exists", room != null, "room-14");
  add("canonical Level 1 Trauma exists", trauma != null, "room-level-1-trauma");
  if (room != null) {
    add("room-14 is storage", room.roomType === "storage", room.roomType);
    add("room-14 geometry x preserved", room.x === 34, room.x);
    add("room-14 geometry y preserved", room.y === 18, room.y);
    add("room-14 geometry width preserved", room.widthFeet === 16, room.widthFeet);
    add("room-14 geometry length preserved", room.lengthFeet === 14, room.lengthFeet);
    add("room-14 metadata class is storage", room.roomOperationalMetadata?.roomClass === "storage", room.roomOperationalMetadata?.roomClass);
  }
  add("manifest marks trauma storage implemented", manifest.canonicalTraumaStorageStatus === "implemented", manifest.canonicalTraumaStorageStatus);
}

if (stage === "gray-presentation" || stage === "visual-dom-proof" || stage === "final") {
  const styles = fs.readFileSync("apps/web/src/features/layout-editor/roomPresentationStyles.ts", "utf8");
  const roomShape = fs.readFileSync("apps/web/src/features/layout-editor/RoomShape.tsx", "utf8");
  const legend = fs.readFileSync("apps/web/src/features/layout-editor/PresentationLegend.tsx", "utf8");
  const overlay = fs.readFileSync("apps/web/src/features/layout-editor/layoutAssignmentOverlayViewModel.ts", "utf8");
  add("storage gray style exists", /storage:[\s\S]*fill:\s*"#b8c0ca"/.test(styles), "roomPresentationStyles.ts");
  add("solid wall gray style exists", /solid_wall:[\s\S]*fill:\s*"#6f7782"/.test(styles), "roomPresentationStyles.ts");
  add("RoomShape exposes muted DOM state", roomShape.includes("data-presentation-muted"), "RoomShape.tsx");
  add("RoomShape blocks assignment color for muted types", roomShape.includes("presentationStyle.muted"), "RoomShape.tsx");
  add("legend includes storage", legend.includes("data-room-type-legend") && styles.includes("Storage"), "PresentationLegend.tsx");
  add("legend includes solid wall", legend.includes("data-room-type-legend") && styles.includes("Solid wall / blocked area"), "PresentationLegend.tsx");
  add("assignment overlay skips muted types", overlay.includes("roomTypeSuppressesAssignmentOverlay"), "layoutAssignmentOverlayViewModel.ts");
  add("manifest marks gray presentation implemented", manifest.grayPresentationStatus === "implemented", manifest.grayPresentationStatus);
  add("manifest marks storage gray", manifest.storageGreysOut === true, manifest.storageGreysOut);
  add("manifest marks solid wall gray", manifest.solidWallGreysOut === true, manifest.solidWallGreysOut);
}

if (stage === "solid-wall-no-doors" || stage === "legacy-invalid-layouts" || stage === "final") {
  const editableContract = fs.readFileSync("packages/shared/src/layout-editor/editableLayoutGeometryContract.ts", "utf8");
  const authoring = fs.readFileSync("packages/shared/src/floorplans/doorAuthoringContract.ts", "utf8");
  const placement = fs.readFileSync("packages/shared/src/floorplans/doorPlacementValidity.ts", "utf8");
  const pathRules = fs.readFileSync("packages/shared/src/floorplans/pathNodeRules.ts", "utf8");
  const quickEdit = fs.readFileSync("apps/web/src/features/layout-editor/RoomQuickEditPopover.tsx", "utf8");
  const quickEditVm = fs.readFileSync("apps/web/src/features/layout-editor/roomQuickEditViewModel.ts", "utf8");
  add("editable import validation rejects solid wall doors", editableContract.includes("must not reference solid_wall"), "editableLayoutGeometryContract.ts");
  add("door authoring rejects ineligible room types", authoring.includes("isDoorEligibleRoomType"), "doorAuthoringContract.ts");
  add("door placement validity flags ineligible owner", placement.includes("owner_room_door_ineligible"), "doorPlacementValidity.ts");
  add("path node rules block ineligible room types", pathRules.includes("isPathNodeEligibleRoomType"), "pathNodeRules.ts");
  add("RoomQuickEdit disables Add Door", quickEdit.includes("viewModel.addDoorDisabled"), "RoomQuickEditPopover.tsx");
  add("RoomQuickEdit view model has solid wall reason", quickEditVm.includes("cannot accept doors"), "roomQuickEditViewModel.ts");
  add("manifest marks solid wall door validation implemented", manifest.solidWallDoorValidationStatus === "implemented", manifest.solidWallDoorValidationStatus);
}

if (stage === "assignment-exclusion" || stage === "capacity-ratio-exclusion" || stage === "final") {
  const assignmentValidation = fs.readFileSync("packages/shared/src/assignment/assignmentValidation.ts", "utf8");
  const genericAssignment = fs.readFileSync("packages/shared/src/assignment/validateManualAssignment.ts", "utf8");
  const capacity = fs.readFileSync("packages/shared/src/capacity/capacityRoomEligibility.ts", "utf8");
  const reducer = fs.readFileSync("apps/web/src/features/manual-assignment/manualAssignmentReducer.ts", "utf8");
  const workspace = fs.readFileSync("apps/web/src/features/manual-assignment/manualAssignmentWorkspaceViewModel.ts", "utf8");
  add("Plan 1 assignment validation uses room type rules", assignmentValidation.includes("isNurseAssignableRoomType"), "assignmentValidation.ts");
  add("generic manual assignment validation uses room type rules", genericAssignment.includes("isNurseAssignableRoomType"), "validateManualAssignment.ts");
  add("manual assignment reducer rejects ineligible room types", reducer.includes("isNurseAssignableRoomType"), "manualAssignmentReducer.ts");
  add("manual workspace exposes disabled reasons", workspace.includes("Storage is excluded from nurse assignment."), "manualAssignmentWorkspaceViewModel.ts");
  add("capacity helper excludes non-ratio room types", capacity.includes("isRatioCountEligibleRoomType"), "capacityRoomEligibility.ts");
  add("manifest marks assignment exclusion implemented", manifest.assignmentExclusionStatus === "implemented", manifest.assignmentExclusionStatus);
  add("manifest marks capacity ratio exclusion implemented", manifest.capacityRatioExclusionStatus === "implemented", manifest.capacityRatioExclusionStatus);
}

if (stage === "room-load-exclusion" || stage === "legacy-invalid-layouts" || stage === "final") {
  const roomLoadValidation = fs.readFileSync("packages/shared/src/scenarios/roomLoadValidation.ts", "utf8");
  const roomLoadContract = fs.readFileSync("packages/shared/src/assignment/roomLoadContract.ts", "utf8");
  const contracts = fs.readFileSync("packages/shared/src/contracts.ts", "utf8");
  const scenarioSeed = fs.readFileSync("packages/shared/src/scenarios/scenarioSeedContract.ts", "utf8");
  const assignmentEditor = fs.readFileSync("apps/web/src/features/assignments/RoomLoadEditor.tsx", "utf8");
  const semanticEditorVm = fs.readFileSync("apps/web/src/features/room-loads/roomLoadEditorViewModel.ts", "utf8");
  const fixture = readJson("packages/shared/fixtures/assignments/plan-1/room-loads-baseline.json");
  add("room-load eligibility helper uses room type rules", roomLoadValidation.includes("isRoomLoadEligibleRoomType"), "roomLoadValidation.ts");
  add("Plan 1 room-load validation rejects ineligible rooms", roomLoadContract.includes("assertRoomLoadsEligibleForPlan"), "roomLoadContract.ts");
  add("generic room-load validation rejects ineligible rooms", contracts.includes("excluded from room-load inputs"), "contracts.ts");
  add("scenario seed room target selector filters room-load eligible rooms", scenarioSeed.includes("selectScenarioSeedRoomLoadRoomIds"), "scenarioSeedContract.ts");
  add("assignment room-load editor exposes storage disabled reason", assignmentEditor.includes("Storage is excluded from room-load inputs."), "RoomLoadEditor.tsx");
  add("semantic room-load editor exposes solid wall disabled reason", semanticEditorVm.includes("Solid wall / blocked area is excluded from room-load inputs."), "roomLoadEditorViewModel.ts");
  add("Plan 1 room-load fixture excludes Trauma One storage", !fixture.roomLoads.some((roomLoad) => roomLoad.roomId === "room-14"), "room-loads-baseline.json");
  add("manifest marks room load exclusion implemented", manifest.roomLoadExclusionStatus === "implemented", manifest.roomLoadExclusionStatus);
}

if (stage === "add-object-placement" || stage === "final") {
  const menu = fs.readFileSync("apps/web/src/features/layout-editor/addObjectMenuViewModel.ts", "utf8");
  const clickToPlace = fs.readFileSync("apps/web/src/features/layout-editor/clickToPlaceObject.ts", "utf8");
  const preview = fs.readFileSync("apps/web/src/features/layout-editor/ObjectPlacementPreview.tsx", "utf8");
  const stageSource = fs.readFileSync("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "utf8");
  const creation = fs.readFileSync("packages/shared/src/floorplans/layoutObjectCreation.ts", "utf8");
  const addRoomContract = fs.readFileSync("packages/shared/src/floorplans/addRoomContract.ts", "utf8");
  add("Add Object includes Patient Care Room", menu.includes("Patient Care Room"), "addObjectMenuViewModel.ts");
  add("Add Object includes Storage Room", menu.includes("Storage Room"), "addObjectMenuViewModel.ts");
  add("Add Object includes Solid Wall / Blocked Area", menu.includes("Solid Wall / Blocked Area"), "addObjectMenuViewModel.ts");
  add("primary menu excludes ambiguous generic Room", !/label:\s*"Room"/.test(menu), "addObjectMenuViewModel.ts");
  add("placement maps storage room to storage semantics", menu.includes('return "storage"'), "addObjectMenuViewModel.ts");
  add("placement maps solid wall to solid_wall semantics", menu.includes('return "solid_wall"'), "addObjectMenuViewModel.ts");
  add("click placement routes explicit room types to add-room reducer", clickToPlace.includes("isRoomPlacementMenuItem"), "clickToPlaceObject.ts");
  add("placement preview uses semantic room styles", clickToPlace.includes("getRoomPresentationStyle"), "clickToPlaceObject.ts");
  add("preview applies semantic fill and stroke", preview.includes("viewModel.fill") && preview.includes("viewModel.stroke"), "ObjectPlacementPreview.tsx");
  add("stage sets selected room type from menu", stageSource.includes("roomTypeForPlacementMenuItem"), "LayoutEditorStage.tsx");
  add("shared creation emits storage semantics", creation.includes('return "storage"') || creation.includes("authoringRoomTypeToEditableRoomType"), "layoutObjectCreation.ts");
  add("solid-wall placement avoids door/path warnings", addRoomContract.includes("isDoorEligibleRoomType") && addRoomContract.includes("isPathNodeEligibleRoomType"), "addRoomContract.ts");
  add("manifest marks add object placement implemented", manifest.addObjectPlacementStatus === "implemented", manifest.addObjectPlacementStatus);
}

if (!allowPartial && stage !== "final") {
  add("non-final stages require --allow-partial until issue 440", false, `issue ${issue}`);
}

if (stage === "final") {
  const requiredStatuses = [
    "roomTypeSemanticsStatus",
    "canonicalTraumaStorageStatus",
    "grayPresentationStatus",
    "solidWallDoorValidationStatus",
    "assignmentExclusionStatus",
    "capacityRatioExclusionStatus",
    "roomLoadExclusionStatus",
    "addObjectPlacementStatus",
    "pathGraphBlockingStatus",
    "legacyInvalidLayoutStatus",
    "visualDomProofStatus"
  ];
  for (const key of requiredStatuses) {
    add(`${key} complete`, ["implemented", "passed", "complete"].includes(manifest[key]), manifest[key]);
  }
  add("go/no-go ready", manifest.goNoGoStatus !== "not_ready", manifest.goNoGoStatus);
}

const failed = checks.filter((check) => !check.passed);
const output = {
  stage,
  issue,
  allowPartial,
  status: failed.length === 0 ? "passed" : "failed",
  checks
};
console.log(JSON.stringify(output, null, 2));
if (failed.length > 0) {
  process.exitCode = 1;
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) continue;
    const key = value.slice(2);
    const next = values[index + 1];
    if (next == null || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function readJson(filePath) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    fail(`missing required manifest: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(resolved, "utf8"));
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
