#!/usr/bin/env node
import {
  addCheck,
  buildSplitRoomTestLayout,
  ensureIssueDirs,
  hasFlag,
  readArg,
  requiredIssueCommands,
  splitRoomCloseoutHardeningManifestPath,
  statusFromChecks,
  updateSplitRoomCloseoutHardeningManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeEvidenceSlots,
  writeJson,
  writeTextIfMissing
} from "./lib/split-room-authoring-utils.mjs";

const {
  evaluateSplitRoomAdjacency,
  resolveSplitRoomPair,
  SPLIT_ROOM_ADJACENCY_TOLERANCE_FEET
} = await import("../packages/shared/dist/index.js");

const issue = readArg("--issue", "689");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const supportedStages = [
  "adjacency-contract",
  "horizontal-adjacent-valid",
  "vertical-adjacent-valid",
  "same-row-separated-blocked",
  "same-column-separated-blocked",
  "overlap-blocked",
  "canonical-pairs-still-pass",
  "final"
];

if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported split-room adjacency hardening stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: aligned split-room candidates must be physically edge-adjacent, not merely same-row or same-column.\n"
);

const stages = stage === "final"
  ? [
      "adjacency-contract",
      "horizontal-adjacent-valid",
      "vertical-adjacent-valid",
      "same-row-separated-blocked",
      "same-column-separated-blocked",
      "overlap-blocked",
      "canonical-pairs-still-pass"
    ]
  : [stage];
const checks = [];
const stageResults = {};

for (const selectedStage of stages) {
  stageResults[selectedStage] = runStage(selectedStage);
}

const status = statusFromChecks(checks);
if (status === "passed") {
  updateSplitRoomCloseoutHardeningManifest(issue, {
    splitRoomAdjacencyHardeningStatus: "passed",
    splitRoomSeparatedAlignedRoomsBlocked: true,
    splitRoomCanonicalPairsStillPass: true,
    splitRoomOverlapBlocked: true
  });
}

writeEvidenceSlots(issue, "split-room-adjacency-hardening", status, stage, checks);
writeJson(`${dir}/test-output/split-room-adjacency-hardening.txt`, {
  status,
  issue,
  stage,
  checks,
  stageResults
});
writeCommandsAndCloseout(status);

console.log(JSON.stringify({ status, issue, stage, checks }, null, 2));
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(selectedStage) {
  if (selectedStage === "adjacency-contract") {
    const output = {
      status:
        typeof SPLIT_ROOM_ADJACENCY_TOLERANCE_FEET === "number" &&
        SPLIT_ROOM_ADJACENCY_TOLERANCE_FEET === 0.01 &&
        typeof evaluateSplitRoomAdjacency === "function"
          ? "passed"
          : "failed",
      toleranceFeet: SPLIT_ROOM_ADJACENCY_TOLERANCE_FEET,
      resultShape: {
        adjacent: evaluateSplitRoomAdjacency(room("room-04", "4", 0, 0), room("room-05", "5", 10, 0)),
        blocked: evaluateSplitRoomAdjacency(room("room-04", "4", 0, 0), room("room-05", "5", 12, 0))
      }
    };
    writeJson(`${dir}/adjacency-contract-output.json`, output);
    addCheck(checks, "split-room adjacency contract exports strict result and 0.01 ft tolerance", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "horizontal-adjacent-valid") {
    const result = resolveSplitRoomPair({ layout: horizontalAdjacentLayout(), selectedRoomId: "room-05" });
    const adjacency = evaluateSplitRoomAdjacency(room("room-04", "4", 0, 0), room("room-05", "5", 10, 0));
    const output = {
      status: result.status === "ready" && adjacency.status === "adjacent" && adjacency.orientation === "horizontal"
        ? "passed"
        : "failed",
      resolution: result,
      adjacency
    };
    writeJson(`${dir}/horizontal-adjacent-valid-output.json`, output);
    addCheck(checks, "touching same-row rooms resolve as a horizontal split room", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "vertical-adjacent-valid") {
    const result = resolveSplitRoomPair({ layout: verticalAdjacentLayout(), selectedRoomId: "room-05" });
    const adjacency = evaluateSplitRoomAdjacency(room("room-04", "4", 0, 0), room("room-05", "5", 0, 10));
    const output = {
      status: result.status === "ready" && adjacency.status === "adjacent" && adjacency.orientation === "vertical"
        ? "passed"
        : "failed",
      resolution: result,
      adjacency
    };
    writeJson(`${dir}/vertical-adjacent-valid-output.json`, output);
    addCheck(checks, "touching same-column rooms resolve as a vertical split room", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "same-row-separated-blocked") {
    const result = resolveSplitRoomPair({ layout: sameRowSeparatedLayout(), selectedRoomId: "room-05" });
    const output = {
      status: result.status === "blocked" && /not adjacent enough to form one physical bay/u.test(result.reason)
        ? "passed"
        : "failed",
      resolution: result
    };
    writeJson(`${dir}/same-row-separated-blocked-output.json`, output);
    addCheck(checks, "same-row rooms separated by grid space are blocked", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "same-column-separated-blocked") {
    const result = resolveSplitRoomPair({ layout: sameColumnSeparatedLayout(), selectedRoomId: "room-05" });
    const output = {
      status: result.status === "blocked" && /not adjacent enough to form one physical bay/u.test(result.reason)
        ? "passed"
        : "failed",
      resolution: result
    };
    writeJson(`${dir}/same-column-separated-blocked-output.json`, output);
    addCheck(checks, "same-column rooms separated by grid space are blocked", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "overlap-blocked") {
    const result = resolveSplitRoomPair({ layout: overlappingLayout(), selectedRoomId: "room-05" });
    const output = {
      status: result.status === "blocked" && /not adjacent enough to form one physical bay/u.test(result.reason)
        ? "passed"
        : "failed",
      resolution: result
    };
    writeJson(`${dir}/overlap-blocked-output.json`, output);
    addCheck(checks, "overlapping canonical rooms are blocked", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "canonical-pairs-still-pass") {
    const layout = buildSplitRoomTestLayout();
    const selectedRoomIds = ["room-02", "room-03", "room-04", "room-05", "room-06", "room-07", "room-08", "room-09"];
    const results = selectedRoomIds.map((selectedRoomId) => ({
      selectedRoomId,
      resolution: resolveSplitRoomPair({ layout, selectedRoomId })
    }));
    const output = {
      status: results.every((item) => item.resolution.status === "ready") ? "passed" : "failed",
      results
    };
    writeJson(`${dir}/canonical-pairs-still-pass-output.json`, output);
    addCheck(checks, "all canonical split-room pairs still pass when physically adjacent", output.status === "passed", output);
    return output;
  }

  throw new Error(`Unhandled stage: ${selectedStage}`);
}

function horizontalAdjacentLayout() {
  return layoutWithRooms([
    room("room-04", "4", 0, 0),
    room("room-05", "5", 10, 0)
  ]);
}

function verticalAdjacentLayout() {
  return layoutWithRooms([
    room("room-04", "4", 0, 0),
    room("room-05", "5", 0, 10)
  ]);
}

function sameRowSeparatedLayout() {
  return layoutWithRooms([
    room("room-04", "4", 0, 0),
    room("room-05", "5", 12, 0)
  ]);
}

function sameColumnSeparatedLayout() {
  return layoutWithRooms([
    room("room-04", "4", 0, 0),
    room("room-05", "5", 0, 12)
  ]);
}

function overlappingLayout() {
  return layoutWithRooms([
    room("room-04", "4", 0, 0),
    room("room-05", "5", 8, 0)
  ]);
}

function layoutWithRooms(rooms) {
  return {
    schemaVersion: "1.0.0",
    layoutId: "split-room-adjacency-hardening-test-layout",
    units: "feet",
    rooms,
    doors: [],
    supportAccessPoints: [],
    stations: [],
    hallways: [],
    zones: [],
    splitBays: [],
    limitations: ["Synthetic local split-room adjacency proof layout."]
  };
}

function room(id, number, xFeet, yFeet) {
  return {
    objectType: "room",
    id,
    label: number,
    roomNumber: number,
    roomType: "standard",
    capacityType: "single",
    isHallBed: false,
    isTraumaAdjacent: false,
    xFeet,
    yFeet,
    widthFeet: 10,
    heightFeet: 10
  };
}

function writeCommandsAndCloseout(status) {
  const commands = requiredIssueCommands(issue, "check-split-room-adjacency-hardening", [
    "adjacency-contract",
    "horizontal-adjacent-valid",
    "vertical-adjacent-valid",
    "same-row-separated-blocked",
    "same-column-separated-blocked",
    "overlap-blocked",
    "canonical-pairs-still-pass"
  ]);
  writeCommands(issue, commands, {
    [`node scripts/check-split-room-adjacency-hardening.mjs --stage adjacency-contract --allow-partial --issue ${issue}`]: `${dir}/adjacency-contract-output.json`,
    [`node scripts/check-split-room-adjacency-hardening.mjs --stage horizontal-adjacent-valid --allow-partial --issue ${issue}`]: `${dir}/horizontal-adjacent-valid-output.json`,
    [`node scripts/check-split-room-adjacency-hardening.mjs --stage vertical-adjacent-valid --allow-partial --issue ${issue}`]: `${dir}/vertical-adjacent-valid-output.json`,
    [`node scripts/check-split-room-adjacency-hardening.mjs --stage same-row-separated-blocked --allow-partial --issue ${issue}`]: `${dir}/same-row-separated-blocked-output.json`,
    [`node scripts/check-split-room-adjacency-hardening.mjs --stage same-column-separated-blocked --allow-partial --issue ${issue}`]: `${dir}/same-column-separated-blocked-output.json`,
    [`node scripts/check-split-room-adjacency-hardening.mjs --stage overlap-blocked --allow-partial --issue ${issue}`]: `${dir}/overlap-blocked-output.json`,
    [`node scripts/check-split-room-adjacency-hardening.mjs --stage canonical-pairs-still-pass --allow-partial --issue ${issue}`]: `${dir}/canonical-pairs-still-pass-output.json`
  });
  writeCloseout(issue, "Split-room pair physical adjacency hardening.", status, commands, [
    "The shared resolver now blocks aligned rooms unless their physical edges touch or are within 0.01 ft tolerance.",
    "Canonical pass evidence uses physically adjacent synthetic pairs; broader default floorplan reconstruction remains governed by later browser gates."
  ], [splitRoomCloseoutHardeningManifestPath]);
}
