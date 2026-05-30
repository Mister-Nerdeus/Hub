#!/usr/bin/env node
import {
  buildCanonicalCapacityCountReport,
  buildCanonicalSplitBayEditableOverlays,
  getSplitBayFixtureOccupancyBridge
} from "../packages/shared/dist/index.js";
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  issueDir,
  readArg,
  requiredAcceptanceCommands,
  statusFromChecks,
  updateAuthoringReadinessManifest,
  writeBoundaryOutputs,
  writeIssueResult,
  writeJson,
  writeTextIfMissing
} from "./lib/editor-reconstruction-authoring-readiness-utils.mjs";

const issue = readArg("--issue", "665");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const supportedStages = ["bridge", "room-pair-mapping", "occupancy-semantics", "capacity-count", "final"];
if (!supportedStages.includes(stage)) throw new Error(`Unsupported stage: ${stage}`);

const dir = issueDir(issue);
const checks = [];
const blockers = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: canonical split-bay definitions for rooms 2-9 must bridge into editable split-bay overlays while preserving bed-position semantics.\n"
);

const rooms = canonicalRooms2Through9();
const bridge = buildCanonicalSplitBayEditableOverlays(rooms);
const capacity = buildCanonicalCapacityCountReport();
const expectedMappings = {
  "room-02": "split-bay-02-03",
  "room-03": "split-bay-02-03",
  "room-04": "split-bay-04-05",
  "room-05": "split-bay-04-05",
  "room-06": "split-bay-06-07",
  "room-07": "split-bay-06-07",
  "room-08": "split-bay-08-09",
  "room-09": "split-bay-08-09"
};
const bridgeSemantics = Object.keys(expectedMappings).map((roomId) =>
  getSplitBayFixtureOccupancyBridge(roomId)
);

if (stage === "bridge" || stage === "final") {
  addCheck(checks, "canonical split-bay source truth bridges to editable overlays", bridge.status === "passed" && bridge.splitBays.length === 4, bridge);
}
if (stage === "room-pair-mapping" || stage === "final") {
  addCheck(
    checks,
    "rooms 2/3, 4/5, 6/7, and 8/9 map to their canonical split bays",
    Object.entries(expectedMappings).every(([roomId, splitBayId]) => bridge.roomPairMappings[roomId] === splitBayId),
    bridge.roomPairMappings
  );
}
if (stage === "occupancy-semantics" || stage === "final") {
  addCheck(
    checks,
    "bed-position assignment and ratio semantics remain true through bridge rules",
    bridgeSemantics.every((entry) => entry.occupancyType === "bed_position" && entry.assignmentEligible && entry.ratioEligible && entry.bedCountContribution === 1),
    bridgeSemantics
  );
}
if (stage === "capacity-count" || stage === "final") {
  addCheck(
    checks,
    "capacity count separates split bays from duplicated physical rooms",
    capacity.splitBayCount === 4 && capacity.physicalRoomCount < capacity.bedPositionCount,
    capacity
  );
}

const passed = statusFromChecks(checks) === "passed";
if (!passed) blockers.push("Canonical split-bay editable bridge proof is incomplete.");

updateAuthoringReadinessManifest(issue, {
  canonicalSplitBayBridgeStatus: passed ? "passed" : "failed",
  canonicalSplitBayBridgeSupported: passed,
  reconstructionStatus: "no_go_until_runtime_saved_copy_support_access_and_split_bay_pass",
  goNoGoStatus: "not_ready"
});

writeJson(`${dir}/canonical-split-bay-editable-bridge-output.json`, { status: passed ? "passed" : "failed", stage, bridge, capacity, bridgeSemantics });
writeIssueResult({
  issue,
  scriptName: "check-canonical-split-bay-editable-bridge",
  stage,
  status: passed ? "passed" : "failed",
  checks,
  blockers,
  commands: requiredAcceptanceCommands(issue, "check-canonical-split-bay-editable-bridge", supportedStages.filter((value) => value !== "final")),
  title: "Canonical split-bay pairs bridge into editable overlays while preserving occupancy and capacity semantics.",
  limitations: ["Manual visual review remains required for final floorplan reconstruction fidelity."]
});

console.log(JSON.stringify({ status: passed ? "passed" : "failed", issue, stage, blockers }, null, 2));
if (!passed && !allowPartial) process.exit(1);

function canonicalRooms2Through9() {
  return Array.from({ length: 8 }, (_, index) => {
    const number = String(index + 2).padStart(2, "0");
    return {
      objectType: "room",
      id: `room-${number}`,
      label: `Room ${number}`,
      roomNumber: number,
      roomType: "standard",
      capacityType: "single",
      isHallBed: false,
      isTraumaAdjacent: false,
      xFeet: (index % 2) * 10,
      yFeet: Math.floor(index / 2) * 12,
      widthFeet: 10,
      heightFeet: 10
    };
  });
}
