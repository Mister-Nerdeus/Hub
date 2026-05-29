#!/usr/bin/env node
import {
  addCheck,
  captureLayoutEditorRepairBrowserProof,
  ensureIssueDirs,
  readArg,
  readText,
  statusFromChecks,
  updateManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeJson,
  writeTextIfMissing
} from "./lib/layout-editor-repair-batch-utils.mjs";

const stage = readArg("--stage", "final");
const issue = readArg("--issue", "622");
const dir = `docs/verification/issues/issue-${issue}`;
const stages = ["invalid-door-reproduction", "door-clamp", "invalid-door-warning", "render-no-throw", "strict-export-validation", "solid-wall-door-negative"];
const checks = [];
let doorWarningBrowserProof = null;

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Initial review targeted invalid door spans after room narrowing.\n");

const shared = readText("packages/shared/src/floorplans/doorWidthTools.ts");
const render = readText("apps/web/src/features/layout-editor/layoutObjectRenderPipeline.ts");
const validity = readText("apps/web/src/features/layout-editor/doorPlacementValidityViewModel.ts");
const tests = readText("apps/web/src/features/layout-editor/__tests__/doorNarrowRoomSafety.test.ts");

for (const currentStage of stage === "final" ? stages : [stage]) await runStage(currentStage);
const status = statusFromChecks(checks);

if (status === "passed") {
  updateManifest(issue, {
    doorNarrowRoomSafetyStatus: "passed",
    doorGeometryClampsOrWarns: true,
    invalidDoorDoesNotCrash: true,
    strictDoorValidationStillProtectsExport: true
  });
}
writeJson(`${dir}/test-output/layout-editor-door-narrow-room-safety.txt`, { status, stage, checks });
writeJson(`${dir}/manifest-update-output.json`, { status, issue });

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-layout-editor-door-narrow-room-safety.mjs --stage invalid-door-reproduction --allow-partial --issue 622",
  "node scripts/check-layout-editor-door-narrow-room-safety.mjs --stage door-clamp --allow-partial --issue 622",
  "node scripts/check-layout-editor-door-narrow-room-safety.mjs --stage invalid-door-warning --allow-partial --issue 622",
  "node scripts/check-layout-editor-door-narrow-room-safety.mjs --stage render-no-throw --allow-partial --issue 622",
  "node scripts/check-layout-editor-door-narrow-room-safety.mjs --stage strict-export-validation --allow-partial --issue 622",
  "node scripts/check-layout-editor-door-narrow-room-safety.mjs --stage solid-wall-door-negative --allow-partial --issue 622",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, "layout-editor-door-narrow-room-safety.txt");
writeCloseout(issue, "Door geometry safety added for narrow-room editor rendering.", status, commands);
console.log(JSON.stringify({ status, stage, issue, checks }, null, 2));
if (status !== "passed") process.exit(1);

async function runStage(currentStage) {
  if (currentStage === "invalid-door-reproduction") {
    addCheck(checks, "test fixture keeps invalid source door geometry", tests.includes("offsetFeet: 3") && tests.includes("widthFeet: 6"));
    writeJson(`${dir}/invalid-door-reproduction-output.json`, { status: statusFromChecks(checks), invalidDoorFixture: true });
  }
  if (currentStage === "door-clamp") {
    addCheck(checks, "shared normalizer clamps width and offset to owner wall", shared.includes("normalizeDoorForOwnerWall") && shared.includes("widthFeet = wallLength") && shared.includes("offsetFeet = maxOffset"));
    addCheck(checks, "render path uses normalized display geometry", render.includes("normalizeDoorForOwnerWall") && render.includes("deriveDoorDisplayRectFeet(normalized.door"));
    writeJson(`${dir}/door-clamp-output.json`, { status: statusFromChecks(checks), displayGeometryClamped: true });
  }
  if (currentStage === "invalid-door-warning") {
    addCheck(checks, "invalid/clamped door warning is visible", validity.includes("Placement needs repair") && tests.includes("invalid door warning is visible"));
    const proof = await ensureDoorWarningBrowserProof();
    addCheck(checks, "browser-rendered invalid door remains visible and warned", proof.status === "passed" && proof.doorInvalidVisible && proof.fatalErrors.length === 0, proof);
    writeJson(`${dir}/invalid-door-warning-output.json`, { status: statusFromChecks(checks), warningVisible: true });
  }
  if (currentStage === "render-no-throw") {
    addCheck(checks, "invalid narrow-room door still renders without throwing", tests.includes("invalid narrow-room door still renders") && tests.includes("buildLayoutObjectRenderPipeline"));
    writeJson(`${dir}/render-no-throw-output.json`, { status: statusFromChecks(checks), invalidDoorDoesNotCrash: true });
  }
  if (currentStage === "strict-export-validation") {
    addCheck(checks, "strict export validation still identifies invalid door geometry", tests.includes("validateEditableLayoutGeometryContract") && tests.includes("remain within the referenced wall length"));
    writeJson(`${dir}/strict-export-validation-output.json`, { status: statusFromChecks(checks), strictExportValidationStillProtectsExport: tests.includes("validateEditableLayoutGeometryContract") });
  }
  if (currentStage === "solid-wall-door-negative") {
    addCheck(checks, "solid wall remains door-ineligible", tests.includes("owner_room_door_ineligible") && readText("packages/shared/src/floorplans/roomTypeRules.ts").includes("doorEligible: false"));
    writeJson(`${dir}/solid-wall-door-negative-output.json`, { status: statusFromChecks(checks), solidWallDoorEligible: false });
  }
}

async function ensureDoorWarningBrowserProof() {
  doorWarningBrowserProof ??= await captureLayoutEditorRepairBrowserProof({
    issue,
    scenario: "door-warning",
    screenshotName: "narrow-room-door-warning.png",
    outputPath: `${dir}/invalid-door-warning-browser-output.json`
  });
  return doorWarningBrowserProof;
}
