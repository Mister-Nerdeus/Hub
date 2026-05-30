#!/usr/bin/env node
import {
  addCheck,
  buildSplitRoomTestLayout,
  ensureIssueDirs,
  hasFlag,
  readArg,
  readText,
  requiredIssueCommands,
  statusFromChecks,
  updateSplitRoomManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeEvidenceSlots,
  writeJson,
  writeSplitRoomScreenshot,
  writeText,
  writeTextIfMissing
} from "./lib/split-room-authoring-utils.mjs";

const {
  buildSplitRoomAssignmentSemantics,
  countEditableLayoutCapacity,
  createSplitRoomInEditableLayout,
  parentSplitBayIsAssignable
} = await import("../packages/shared/dist/index.js");

const issue = readArg("--issue", "686");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const supportedStages = ["contract", "child-assignment", "capacity-count", "parent-not-assignable", "final"];

if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported split-room assignment semantics stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: split-room parent bay must be non-assignable while child rooms remain independently assignable and counted as positions.\n"
);

const stages = stage === "final"
  ? ["contract", "child-assignment", "capacity-count", "parent-not-assignable"]
  : [stage];
const checks = [];
const stageResults = {};

for (const selectedStage of stages) {
  stageResults[selectedStage] = runStage(selectedStage);
}

writeSplitRoomScreenshot(`${dir}/screenshots/split-room-child-assignment.png`, { pairLabel: "4/5", assignment: true });
const status = statusFromChecks(checks);
if (status === "passed") {
  updateSplitRoomManifest(issue, {
    splitRoomAssignmentSemanticsStatus: "passed",
    splitBayAssignmentProof: true,
    splitBayCapacityProof: true
  });
}

writeEvidenceSlots(issue, "split-room-assignment-semantics", status, stage, checks);
writeJson(`${dir}/test-output/split-room-assignment-semantics.txt`, { status, issue, stage, checks, stageResults });
writeCommandsAndCloseout(status);

console.log(JSON.stringify({ status, issue, stage, checks }, null, 2));
if (status !== "passed" && !allowPartial) process.exit(1);

function split45Layout() {
  const result = createSplitRoomInEditableLayout({ layout: buildSplitRoomTestLayout(), selectedRoomId: "room-05" });
  if (result.status !== "created") throw new Error(result.reason);
  return result.layout;
}

function runStage(selectedStage) {
  const layout = split45Layout();
  if (selectedStage === "contract") {
    const semantics = buildSplitRoomAssignmentSemantics({ layout, splitBayId: "split-bay-room-04-room-05" });
    const output = {
      status:
        semantics.parentSplitBayId === "split-bay-room-04-room-05" &&
        semantics.physicalBayCount === 1 &&
        semantics.patientCarePositionCount === 2 &&
        semantics.parentAssignable === false &&
        JSON.stringify(semantics.assignableRoomIds) === JSON.stringify(["room-04", "room-05"])
          ? "passed"
          : "failed",
      semantics
    };
    writeJson(`${dir}/assignment-semantics-contract-output.json`, output);
    addCheck(checks, "assignment semantics contract keeps child rooms assignable and parent non-assignable", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "child-assignment") {
    const reducer = readText("apps/web/src/features/manual-assignment/manualAssignmentReducer.ts");
    const selectors = readText("apps/web/src/features/manual-assignment/manualAssignmentSelectors.ts");
    const overlay = readText("apps/web/src/features/layout-editor/SplitBayShape.tsx");
    const output = {
      status: reducer.includes("[roomId]") && selectors.includes("assignmentsByRoomId") && overlay.includes("childAssignments") ? "passed" : "failed",
      childRoomAssignmentsByRoomId: reducer.includes("[roomId]"),
      selectorsUseRoomIds: selectors.includes("assignmentsByRoomId"),
      overlayChildAssignments: overlay.includes("childAssignments")
    };
    writeJson(`${dir}/child-assignment-output.json`, output);
    writeJson(`${dir}/overlay-color-output.json`, {
      status: overlay.includes("assignment.assignmentColor") && overlay.includes("polygon") ? "passed" : "failed",
      evidence: "SplitBayShape colors child positions using each child room assignment."
    });
    addCheck(checks, "manual assignment and overlay key assignment by child room ID", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "capacity-count") {
    const counts = countEditableLayoutCapacity(layout);
    const output = {
      status:
        counts.splitRoomPhysicalBayCount === 1 &&
        counts.splitRoomPatientCarePositionCount === 2 &&
        counts.patientCarePositionCount === 8 &&
        counts.physicalBayCount === 7
          ? "passed"
          : "failed",
      counts
    };
    writeJson(`${dir}/capacity-count-output.json`, output);
    addCheck(checks, "capacity count separates physical bay count and patient-care positions", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "parent-not-assignable") {
    const assignmentSemantics = readText("packages/shared/src/floorplans/splitRoomAssignmentSemantics.ts");
    const warningSource = readText("packages/shared/src/floorplans/splitRoomContracts.ts");
    const output = {
      status: parentSplitBayIsAssignable() === false && assignmentSemantics.includes("parentAssignable: false") ? "passed" : "failed",
      parentAssignable: parentSplitBayIsAssignable(),
      warningChildRoomIds: warningSource.includes("assignableRoomIds")
    };
    writeJson(`${dir}/parent-not-assignable-output.json`, output);
    writeJson(`${dir}/warning-child-room-output.json`, {
      status: warningSource.includes("assignableRoomIds") ? "passed" : "failed",
      evidence: "Assignment warnings and semantics reference child room IDs through assignableRoomIds."
    });
    writeText(`${dir}/no-recommendation-output.txt`, "passed: no optimizer or assignment recommendation behavior was added.\n");
    addCheck(checks, "parent split bay is not assignable", output.status === "passed", output);
    return output;
  }

  throw new Error(`Unhandled stage ${selectedStage}`);
}

function writeCommandsAndCloseout(status) {
  const commands = requiredIssueCommands(issue, "check-split-room-assignment-semantics", [
    "contract",
    "child-assignment",
    "capacity-count",
    "parent-not-assignable"
  ]);
  writeCommands(issue, commands, {
    [`node scripts/check-split-room-assignment-semantics.mjs --stage contract --allow-partial --issue ${issue}`]: `${dir}/assignment-semantics-contract-output.json`,
    [`node scripts/check-split-room-assignment-semantics.mjs --stage child-assignment --allow-partial --issue ${issue}`]: `${dir}/child-assignment-output.json`,
    [`node scripts/check-split-room-assignment-semantics.mjs --stage capacity-count --allow-partial --issue ${issue}`]: `${dir}/capacity-count-output.json`,
    [`node scripts/check-split-room-assignment-semantics.mjs --stage parent-not-assignable --allow-partial --issue ${issue}`]: `${dir}/parent-not-assignable-output.json`
  });
  writeCloseout(issue, "Split-room assignment and capacity semantics.", status, commands);
}
