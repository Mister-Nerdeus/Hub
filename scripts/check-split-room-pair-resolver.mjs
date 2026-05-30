#!/usr/bin/env node
import {
  addCheck,
  buildSplitRoomTestLayout,
  canonicalSplitRoomPairs,
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
  writeTextIfMissing
} from "./lib/split-room-authoring-utils.mjs";

const { resolveSplitRoomPair, createSplitRoomInEditableLayout } = await import("../packages/shared/dist/index.js");

const issue = readArg("--issue", "682");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const supportedStages = [
  "canonical-contract",
  "room5-resolves-to-45",
  "all-canonical-pairs",
  "blocked-invalid-room",
  "shared-usage",
  "final"
];

if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported split-room pair resolver stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: canonical split-room pair logic must be shared, deterministic, and imported by UI and reducer paths.\n"
);

const stages = stage === "final"
  ? ["canonical-contract", "room5-resolves-to-45", "all-canonical-pairs", "blocked-invalid-room", "shared-usage"]
  : [stage];
const checks = [];
const stageResults = {};

for (const selectedStage of stages) {
  stageResults[selectedStage] = runStage(selectedStage);
}

const status = statusFromChecks(checks);
if (status === "passed") {
  updateSplitRoomManifest(issue, {
    splitRoomPairResolverStatus: "passed",
    canonicalPairsResolved: true
  });
}

writeEvidenceSlots(issue, "split-room-pair-resolver", status, stage, checks);
writeJson(`${dir}/test-output/split-room-pair-resolver.txt`, { status, issue, stage, checks, stageResults });
writeCommandsAndCloseout(status);

console.log(JSON.stringify({ status, issue, stage, checks }, null, 2));
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(selectedStage) {
  const layout = buildSplitRoomTestLayout();
  if (selectedStage === "canonical-contract") {
    const resolution = resolveSplitRoomPair({ layout, selectedRoomId: "room-05" });
    const output = {
      status:
        resolution.status === "ready" &&
        resolution.pairId === "split-bay-room-04-room-05" &&
        resolution.pairLabel === "4/5" &&
        resolution.physicalBayCount === 1 &&
        resolution.patientCarePositionCount === 2
          ? "passed"
          : "failed",
      resolution
    };
    writeJson(`${dir}/canonical-pair-contract-output.json`, output);
    addCheck(checks, "resolver returns canonical contract counts and pair label", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "room5-resolves-to-45") {
    const room5 = resolveSplitRoomPair({ layout, selectedRoomId: "room-05" });
    const room4 = resolveSplitRoomPair({ layout, selectedRoomId: "room-04" });
    const output5 = { status: room5.status === "ready" && room5.pairLabel === "4/5" ? "passed" : "failed", resolution: room5 };
    const output4 = { status: room4.status === "ready" && room4.pairLabel === "4/5" ? "passed" : "failed", resolution: room4 };
    writeJson(`${dir}/room5-resolves-to-45-output.json`, output5);
    writeJson(`${dir}/room4-resolves-to-45-output.json`, output4);
    addCheck(checks, "Room 5 and Room 4 resolve to Split Room 4/5", output5.status === "passed" && output4.status === "passed", { output5, output4 });
    return { output5, output4 };
  }

  if (selectedStage === "all-canonical-pairs") {
    const results = [
      ["room-03", "2/3", `${dir}/room3-resolves-to-23-output.json`],
      ["room-07", "6/7", `${dir}/room7-resolves-to-67-output.json`],
      ["room-09", "8/9", `${dir}/room9-resolves-to-89-output.json`]
    ].map(([roomId, pairLabel, path]) => {
      const resolution = resolveSplitRoomPair({ layout, selectedRoomId: roomId });
      const output = { status: resolution.status === "ready" && resolution.pairLabel === pairLabel ? "passed" : "failed", resolution };
      writeJson(path, output);
      return output;
    });
    const allPairs = canonicalSplitRoomPairs.flatMap(([roomAId, roomBId, pairLabel]) => [roomAId, roomBId].map((roomId) => {
      const resolution = resolveSplitRoomPair({ layout, selectedRoomId: roomId });
      return { roomId, pairLabel, status: resolution.status, resolvedLabel: resolution.status === "ready" ? resolution.pairLabel : null };
    }));
    const output = { status: results.every((result) => result.status === "passed") && allPairs.every((item) => item.status === "ready" && item.resolvedLabel === item.pairLabel) ? "passed" : "failed", results, allPairs };
    addCheck(checks, "all canonical split-room pairs resolve from either room", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "blocked-invalid-room") {
    const invalid = resolveSplitRoomPair({ layout, selectedRoomId: "room-01" });
    const solidWallLayout = {
      ...layout,
      rooms: layout.rooms.map((room) => room.id === "room-04" ? { ...room, roomType: "solid_wall" } : room)
    };
    const solidWall = resolveSplitRoomPair({ layout: solidWallLayout, selectedRoomId: "room-05" });
    const providerLayout = {
      ...layout,
      rooms: layout.rooms.map((room) => room.id === "room-04" ? { ...room, roomType: "provider_pharmacy" } : room)
    };
    const provider = resolveSplitRoomPair({ layout: providerLayout, selectedRoomId: "room-05" });
    const storageLayout = {
      ...layout,
      rooms: layout.rooms.map((room) => room.id === "room-04" ? { ...room, roomType: "storage" } : room)
    };
    const storage = resolveSplitRoomPair({ layout: storageLayout, selectedRoomId: "room-05" });
    const geometryMismatchLayout = {
      ...layout,
      rooms: layout.rooms.map((room) => room.id === "room-04" ? { ...room, yFeet: room.yFeet + 3 } : room)
    };
    const geometryMismatch = resolveSplitRoomPair({ layout: geometryMismatchLayout, selectedRoomId: "room-05" });
    const alreadySplit = createSplitRoomInEditableLayout({ layout, selectedRoomId: "room-05" });
    const alreadySplitResolution = alreadySplit.status === "created"
      ? resolveSplitRoomPair({ layout: alreadySplit.layout, selectedRoomId: "room-05" })
      : alreadySplit;
    const output = {
      status:
        [invalid, solidWall, provider, storage, geometryMismatch, alreadySplitResolution].every((result) => result.status === "blocked")
          ? "passed"
          : "failed",
      invalid,
      solidWall,
      provider,
      storage,
      geometryMismatch,
      alreadySplitResolution
    };
    writeJson(`${dir}/blocked-invalid-room-output.json`, { status: invalid.status === "blocked" ? "passed" : "failed", invalid });
    writeJson(`${dir}/already-split-output.json`, { status: alreadySplitResolution.status === "blocked" ? "passed" : "failed", alreadySplitResolution });
    addCheck(checks, "resolver blocks invalid, solid-wall, provider/pharmacy, and already split rooms", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "shared-usage") {
    const ui = readText("apps/web/src/features/layout-editor/splitRoomWorkflowViewModel.ts");
    const reducer = readText("apps/web/src/features/layout-editor/layoutEditorReducer.ts");
    const authoring = readText("packages/shared/src/floorplans/splitRoomAuthoring.ts");
    const output = {
      status:
        ui.includes("resolveSplitRoomPair") &&
        reducer.includes("resolveSplitRoomPair") &&
        authoring.includes("resolveSplitRoomPair")
          ? "passed"
          : "failed",
      uiUsesResolver: ui.includes("resolveSplitRoomPair"),
      reducerUsesResolver: reducer.includes("resolveSplitRoomPair"),
      authoringUsesResolver: authoring.includes("resolveSplitRoomPair")
    };
    writeJson(`${dir}/shared-usage-output.json`, output);
    addCheck(checks, "UI, reducer, and authoring path use shared resolver", output.status === "passed", output);
    return output;
  }

  throw new Error(`Unhandled stage ${selectedStage}`);
}

function writeCommandsAndCloseout(status) {
  const commands = requiredIssueCommands(issue, "check-split-room-pair-resolver", [
    "canonical-contract",
    "room5-resolves-to-45",
    "all-canonical-pairs",
    "blocked-invalid-room",
    "shared-usage"
  ]);
  writeCommands(issue, commands, {
    [`node scripts/check-split-room-pair-resolver.mjs --stage canonical-contract --allow-partial --issue ${issue}`]: `${dir}/canonical-pair-contract-output.json`,
    [`node scripts/check-split-room-pair-resolver.mjs --stage room5-resolves-to-45 --allow-partial --issue ${issue}`]: `${dir}/room5-resolves-to-45-output.json`,
    [`node scripts/check-split-room-pair-resolver.mjs --stage all-canonical-pairs --allow-partial --issue ${issue}`]: `${dir}/room3-resolves-to-23-output.json`,
    [`node scripts/check-split-room-pair-resolver.mjs --stage blocked-invalid-room --allow-partial --issue ${issue}`]: `${dir}/blocked-invalid-room-output.json`,
    [`node scripts/check-split-room-pair-resolver.mjs --stage shared-usage --allow-partial --issue ${issue}`]: `${dir}/shared-usage-output.json`
  });
  writeCloseout(issue, "Shared split-room pair resolver.", status, commands);
}
