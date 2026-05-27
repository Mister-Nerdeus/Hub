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
