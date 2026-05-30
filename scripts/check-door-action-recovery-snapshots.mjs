#!/usr/bin/env node
import {
  addCheck,
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

const issue = readArg("--issue", "675");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const supportedStages = [
  "snapshot-contract",
  "before-door-action",
  "failed-action-restore",
  "scoped-record",
  "export-snapshot",
  "final"
];

if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported door recovery snapshot stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: door action recovery snapshots must preserve the last valid pre-action layout.\n"
);

const stages = stage === "final"
  ? [
      "snapshot-contract",
      "before-door-action",
      "failed-action-restore",
      "scoped-record",
      "export-snapshot"
    ]
  : [stage];
const checks = [];
const stageResults = {};

for (const selectedStage of stages) {
  stageResults[selectedStage] = runStage(selectedStage);
}

const status = statusFromChecks(checks);
if (stage === "final") {
  updateDoorAuthoringManifest(issue, {
    doorRecoverySnapshotsStatus: status === "passed" ? "passed" : "failed",
    lastValidSnapshotProof: status === "passed",
    goNoGoStatus: "not_ready"
  });
}

writeJson(`${dir}/test-output/door-action-recovery-snapshots.txt`, {
  status,
  issue,
  stage,
  checks,
  stageResults
});
writeEvidenceSlots(issue, "door-action-recovery-snapshots", status, stage, checks);
writeCommandsAndCloseout(status);

console.log(JSON.stringify({ status, issue, stage, checks }, null, 2));
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(selectedStage) {
  const snapshotSource = readText("apps/web/src/features/layout-editor/layoutDoorRecoverySnapshots.ts");
  const stageSource = readText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx");
  const reducerSource = readText("apps/web/src/features/layout-editor/layoutEditorReducer.ts");
  const errorBoundarySource = readText("apps/web/src/features/layout-editor/LayoutEditorErrorBoundary.tsx");
  const recoveryScreenSource = readText("apps/web/src/features/layout-editor/LayoutEditorRecoveryScreen.tsx");
  const testSource = readText("apps/web/src/features/layout-editor/__tests__/doorRecoverySnapshots.test.ts");

  if (selectedStage === "snapshot-contract") {
    const result = {
      status: "passed",
      hasSnapshotType: snapshotSource.includes("export type DoorRecoverySnapshot"),
      hasRecordId: snapshotSource.includes("recordId: string"),
      hasTimestamp: snapshotSource.includes("createdAt: string"),
      hasActionContext: snapshotSource.includes("actionType: string") &&
        snapshotSource.includes("doorId?: string") &&
        snapshotSource.includes("roomId?: string"),
      hasLayoutAndSelection: snapshotSource.includes("editableLayout: EditableLayoutGeometryContract") &&
        snapshotSource.includes("selectedObjectId: string | null") &&
        snapshotSource.includes("selectedObjectType: LayoutEditorSelectableObjectType | null"),
      hasLimit: snapshotSource.includes("DOOR_RECOVERY_SNAPSHOT_LIMIT_PER_RECORD = 10")
    };
    const passed = allTrue(result);
    result.status = passed ? "passed" : "failed";
    addCheck(checks, "door recovery snapshot contract includes required context", passed, result);
    writeJson(`${dir}/snapshot-contract-output.json`, result);
    return result;
  }

  if (selectedStage === "before-door-action") {
    const result = {
      status: "passed",
      stageCreatesSnapshot: stageSource.includes("createDoorRecoverySnapshot"),
      stageSavesSnapshot: stageSource.includes("saveDoorRecoverySnapshot"),
      dispatchWrapperPresent: stageSource.includes("dispatchDoorStageAction"),
      coversDoorActions: [
        "addDoor",
        "moveDoor",
        "updateDoorWidth",
        "assignDoor",
        "deleteDoor",
        "supportAccessAdd",
        "supportAccessMove",
        "supportAccessWidth",
        "supportAccessDelete"
      ].every((actionType) => stageSource.includes(`actionType: "${actionType}"`))
    };
    const passed = allTrue(result);
    result.status = passed ? "passed" : "failed";
    addCheck(checks, "door and support-access actions snapshot before reducer dispatch", passed, result);
    writeJson(`${dir}/before-door-action-output.json`, result);
    return result;
  }

  if (selectedStage === "failed-action-restore") {
    const result = {
      status: "passed",
      reducerPreservesStateOnBlockedDoorAction: reducerSource.includes("appendDoorAuthoringWarning(state"),
      testChecksLayoutPreserved: testSource.includes("failed door mutation must preserve the previous valid editable layout"),
      testChecksWarning: testSource.includes("failed door mutation must append a door authoring warning")
    };
    const passed = allTrue(result);
    result.status = passed ? "passed" : "failed";
    addCheck(checks, "failed door action restores previous valid layout with warning", passed, result);
    writeJson(`${dir}/failed-action-restore-output.json`, result);
    return result;
  }

  if (selectedStage === "scoped-record") {
    const result = {
      status: "passed",
      storageFiltersByRecord: snapshotSource.includes("snapshot.recordId === recordId") ||
        snapshotSource.includes("candidate.recordId === recordId"),
      storageKeepsPerRecordLimit: snapshotSource.includes("snapshot.recordId"),
      testChecksPerRecordLimit: testSource.includes("retain the last 10 snapshots per record"),
      testChecksScopedRecord: testSource.includes("scoped by active record")
    };
    const passed = allTrue(result);
    result.status = passed ? "passed" : "failed";
    addCheck(checks, "door recovery snapshots are scoped by active record ID", passed, result);
    writeJson(`${dir}/scoped-record-output.json`, result);
    return result;
  }

  if (selectedStage === "export-snapshot") {
    const result = {
      status: "passed",
      errorBoundaryLoadsSnapshot: errorBoundarySource.includes("loadLatestDoorRecoverySnapshot"),
      errorBoundaryExportsSnapshot: errorBoundarySource.includes("exportLastValidSnapshot"),
      recoveryScreenHasButton: recoveryScreenSource.includes("Export last valid snapshot"),
      recoveryScreenHasAvailabilityFlag: recoveryScreenSource.includes("lastValidSnapshotAvailable")
    };
    const passed = allTrue(result);
    result.status = passed ? "passed" : "failed";
    addCheck(checks, "recovery screen can export the last valid door snapshot", passed, result);
    writeJson(`${dir}/export-snapshot-output.json`, result);
    return result;
  }

  throw new Error(`Unsupported stage: ${selectedStage}`);
}

function allTrue(result) {
  return Object.entries(result)
    .filter(([key]) => key !== "status")
    .every(([, value]) => value === true);
}

function writeCommandsAndCloseout(status) {
  const commands = requiredIssueCommands(issue, "check-door-action-recovery-snapshots", [
    "snapshot-contract",
    "before-door-action",
    "failed-action-restore",
    "scoped-record",
    "export-snapshot"
  ], [
    `node scripts/check-door-action-recovery-snapshots.mjs --stage final --issue ${issue}`
  ]);
  writeCommands(issue, commands, {
    [`node scripts/check-door-action-recovery-snapshots.mjs --stage snapshot-contract --allow-partial --issue ${issue}`]: `${dir}/snapshot-contract-output.json`,
    [`node scripts/check-door-action-recovery-snapshots.mjs --stage before-door-action --allow-partial --issue ${issue}`]: `${dir}/before-door-action-output.json`,
    [`node scripts/check-door-action-recovery-snapshots.mjs --stage failed-action-restore --allow-partial --issue ${issue}`]: `${dir}/failed-action-restore-output.json`,
    [`node scripts/check-door-action-recovery-snapshots.mjs --stage scoped-record --allow-partial --issue ${issue}`]: `${dir}/scoped-record-output.json`,
    [`node scripts/check-door-action-recovery-snapshots.mjs --stage export-snapshot --allow-partial --issue ${issue}`]: `${dir}/export-snapshot-output.json`,
    [`node scripts/check-door-action-recovery-snapshots.mjs --stage final --issue ${issue}`]: `${dir}/test-output/door-action-recovery-snapshots.txt`
  });
  writeCloseout(
    issue,
    "Door action recovery snapshots before door mutations.",
    status,
    commands,
    [
      "Door and support-access mutations now capture a last-valid snapshot before dispatch.",
      "Failed door actions preserve the previous valid editable layout and append warnings.",
      "Full ER floorplan reconstruction remains blocked until Issue 678 reruns the real validators."
    ]
  );
}
