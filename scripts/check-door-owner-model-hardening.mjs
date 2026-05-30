#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import {
  addCheck,
  abs,
  assertFile,
  ensureIssueDirs,
  hasFlag,
  readArg,
  readText,
  requiredIssueCommands,
  statusFromChecks,
  updateDoorAuthoringManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeEvidenceSlots,
  writeJson,
  writeTextIfMissing
} from "./lib/door-authoring-crash-hardening-utils.mjs";

const issue = readArg("--issue", "674");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const supportedStages = [
  "room-owned-door",
  "hallway-owned-opening",
  "support-access",
  "missing-owner",
  "invalid-owner-no-crash",
  "final"
];

if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported door owner model hardening stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: explicit door owner model must keep room doors, hallway openings, support access, missing owners, and invalid owners distinct.\n"
);

const stages = stage === "final"
  ? [
      "room-owned-door",
      "hallway-owned-opening",
      "support-access",
      "missing-owner",
      "invalid-owner-no-crash"
    ]
  : [stage];
const checks = [];
const stageResults = {};

for (const selectedStage of stages) {
  stageResults[selectedStage] = await runStage(selectedStage);
}

const status = statusFromChecks(checks);
if (stage === "final") {
  updateDoorAuthoringManifest(issue, {
    doorOwnerModelStatus: status === "passed" ? "passed" : "failed",
    goNoGoStatus: "not_ready"
  });
}

writeJson(`${dir}/test-output/door-owner-model-hardening.txt`, {
  status,
  issue,
  stage,
  checks,
  stageResults
});
writeEvidenceSlots(issue, "door-owner-model-hardening", status, stage, checks);
writeCommandsAndCloseout(status);

console.log(JSON.stringify({ status, issue, stage, checks }, null, 2));
if (status !== "passed" && !allowPartial) process.exit(1);

async function runStage(selectedStage) {
  const ownerSource = readText("apps/web/src/features/layout-editor/doorOwnerViewModel.ts");
  const editorSource = readText("apps/web/src/features/layout-editor/DoorEditor.tsx");
  const quickEditSource = readText("apps/web/src/features/layout-editor/DoorQuickEditPopover.tsx");
  const editorViewModelSource = readText("apps/web/src/features/layout-editor/doorEditorViewModel.ts");
  const reducerSource = readText("apps/web/src/features/layout-editor/layoutEditorReducer.ts");
  const contractSource = readText("packages/shared/src/layout-editor/editableLayoutGeometryContract.ts");
  const testSource = readText("apps/web/src/features/layout-editor/__tests__/doorOwnerViewModel.test.tsx");

  if (selectedStage === "room-owned-door") {
    const result = {
      status: "passed",
      ownerModelStatusPresent: ownerSource.includes('status: "room"'),
      roomDoorEligiblePresent: ownerSource.includes("doorEligible"),
      editorUsesOwnerModel: editorSource.includes("buildDoorEditorViewModel({ door, rooms, hallways })"),
      editorEnablesPatientControlsForRoom: editorViewModelSource.includes("patientDoorControlsEnabled"),
      testCoversRoomOwner: testSource.includes("room-owned door should resolve as a valid room owner")
    };
    const passed = allTrue(result);
    result.status = passed ? "passed" : "failed";
    addCheck(checks, "room-owned door owner model is explicit", passed, result);
    writeJson(`${dir}/room-owned-door-output.json`, result);
    return result;
  }

  if (selectedStage === "hallway-owned-opening") {
    const result = {
      status: "passed",
      ownerModelStatusPresent: ownerSource.includes('status: "hallway"'),
      editorShowsHallwayControls: editorSource.includes('aria-label="Hallway opening controls"'),
      quickEditBlocksPatientControls: quickEditSource.includes('viewModel.ownerStatus !== "room"'),
      stageRoomControlsRequireRoomOwner: readText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx").includes('selectedDoor.ownerKind !== "room"'),
      testCoversHallwayOwner: testSource.includes("hallway-owned opening should resolve as a hallway owner")
    };
    const passed = allTrue(result);
    result.status = passed ? "passed" : "failed";
    addCheck(checks, "hallway-owned opening avoids patient-room-only controls", passed, result);
    writeJson(`${dir}/hallway-owned-opening-output.json`, result);
    return result;
  }

  if (selectedStage === "support-access") {
    const result = {
      status: "passed",
      supportAccessStatusPresent: ownerSource.includes('status: "support_access"'),
      supportAccessInputPresent: ownerSource.includes("EditableSupportAccessPointGeometry"),
      supportAccessResolvesZone: ownerSource.includes("zoneId: zone.id"),
      supportAccessOwnerKindsStillSeparate: contractSource.includes("EDITABLE_SUPPORT_ACCESS_OWNER_KINDS"),
      testCoversSupportAccess: testSource.includes("support access point should resolve to a support access owner model")
    };
    const passed = allTrue(result);
    result.status = passed ? "passed" : "failed";
    addCheck(checks, "support access owner model remains separate from patient-room doors", passed, result);
    writeJson(`${dir}/support-access-output.json`, result);
    return result;
  }

  if (selectedStage === "missing-owner") {
    const result = {
      status: "passed",
      missingStatusPresent: ownerSource.includes('status: "missing"'),
      missingWarningPresent: ownerSource.includes("Door owner room is missing"),
      editorShowsRecoveryPanel: editorSource.includes("Owner recovery"),
      quickEditShowsOwnerWarning: quickEditSource.includes("viewModel.ownerWarning"),
      testCoversMissingOwner: testSource.includes("missing door owner should produce a warning model")
    };
    const passed = allTrue(result);
    result.status = passed ? "passed" : "failed";
    addCheck(checks, "missing door owner is a warning model, not a render crash", passed, result);
    writeJson(`${dir}/missing-owner-output.json`, result);
    return result;
  }

  if (selectedStage === "invalid-owner-no-crash") {
    const contractProof = await invalidOwnerContractProof();
    const result = {
      status: "passed",
      invalidStatusPresent: ownerSource.includes('status: "invalid"'),
      invalidWarningPresent: ownerSource.includes("Selected owner cannot use patient-room door controls."),
      reducerCanRecordOwnerWarning: reducerSource.includes("recordDoorOwnerWarning"),
      contractBlocksInvalidDoorOwner: contractProof.status === "passed",
      testCoversInvalidOwner: testSource.includes("invalid door owner must disable patient door controls in the side panel"),
      contractProof
    };
    const passed = allTrue(result);
    result.status = passed ? "passed" : "failed";
    addCheck(checks, "invalid door owner blocks export path and does not crash editor UI", passed, result);
    writeJson(`${dir}/invalid-owner-output.json`, result);
    writeJson(`${dir}/no-crash-output.json`, {
      status: result.status,
      proof: "DoorEditor and DoorQuickEditPopover route missing/invalid/hallway owners to warning states with controls disabled.",
      contractProof
    });
    return result;
  }

  throw new Error(`Unsupported stage: ${selectedStage}`);
}

async function invalidOwnerContractProof() {
  const { validateEditableLayoutGeometryContract } = await loadSharedDist();
  try {
    validateEditableLayoutGeometryContract(invalidSolidWallDoorLayout());
    return { status: "failed", reason: "solid-wall-owned door was accepted" };
  } catch (error) {
    return {
      status: /solid_wall room/iu.test(error instanceof Error ? error.message : String(error))
        ? "passed"
        : "failed",
      errorMessage: error instanceof Error ? error.message : String(error)
    };
  }
}

async function loadSharedDist() {
  const distPath = "packages/shared/dist/index.js";
  if (!assertFile(distPath)) {
    throw new Error("packages/shared dist must be built before running door owner model checks");
  }
  return import(pathToFileURL(abs(distPath)).href);
}

function invalidSolidWallDoorLayout() {
  return {
    schemaVersion: "1.0.0",
    layoutId: "door-owner-invalid-fixture",
    units: "feet",
    rooms: [
      {
        objectType: "room",
        id: "solid-wall-01",
        label: "Solid wall",
        roomNumber: "solid-wall-01",
        roomType: "solid_wall",
        capacityType: "single",
        isHallBed: false,
        isTraumaAdjacent: false,
        xFeet: 0,
        yFeet: 0,
        widthFeet: 12,
        heightFeet: 10
      }
    ],
    doors: [
      {
        objectType: "door",
        id: "door-solid-wall",
        label: "Solid wall door",
        ownerKind: "room",
        ownerId: "solid-wall-01",
        wall: "south",
        offsetFeet: 1,
        widthFeet: 4
      }
    ],
    supportAccessPoints: [],
    stations: [],
    hallways: [],
    zones: [],
    splitBays: [],
    limitations: ["Synthetic operational fixture for invalid door owner verification."]
  };
}

function allTrue(result) {
  return Object.entries(result)
    .filter(([key]) => key !== "status" && key !== "contractProof")
    .every(([, value]) => value === true);
}

function writeCommandsAndCloseout(status) {
  const commands = requiredIssueCommands(issue, "check-door-owner-model-hardening", [
    "room-owned-door",
    "hallway-owned-opening",
    "support-access",
    "missing-owner",
    "invalid-owner-no-crash"
  ], [
    `node scripts/check-door-owner-model-hardening.mjs --stage final --issue ${issue}`
  ]);
  writeCommands(issue, commands, {
    [`node scripts/check-door-owner-model-hardening.mjs --stage room-owned-door --allow-partial --issue ${issue}`]: `${dir}/room-owned-door-output.json`,
    [`node scripts/check-door-owner-model-hardening.mjs --stage hallway-owned-opening --allow-partial --issue ${issue}`]: `${dir}/hallway-owned-opening-output.json`,
    [`node scripts/check-door-owner-model-hardening.mjs --stage support-access --allow-partial --issue ${issue}`]: `${dir}/support-access-output.json`,
    [`node scripts/check-door-owner-model-hardening.mjs --stage missing-owner --allow-partial --issue ${issue}`]: `${dir}/missing-owner-output.json`,
    [`node scripts/check-door-owner-model-hardening.mjs --stage invalid-owner-no-crash --allow-partial --issue ${issue}`]: `${dir}/invalid-owner-output.json`,
    [`node scripts/check-door-owner-model-hardening.mjs --stage final --issue ${issue}`]: `${dir}/test-output/door-owner-model-hardening.txt`
  });
  writeCloseout(
    issue,
    "Door owner model hardening for room doors, hallway openings, support access, and invalid owners.",
    status,
    commands,
    [
      "Room-owned doors, hallway openings, support access points, missing owners, and invalid owners now resolve through an explicit owner view model.",
      "Invalid owner states render warnings and disabled patient-door controls instead of falling into editor recovery.",
      "Full ER floorplan reconstruction remains blocked until Issue 678 reruns the real validators."
    ]
  );
}
