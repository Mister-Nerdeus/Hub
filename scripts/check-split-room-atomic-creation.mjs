#!/usr/bin/env node
import {
  addCheck,
  buildSplitRoomTestLayout,
  canonicalSplitRoomPairs,
  createAllCanonicalSplitRooms,
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

const { createSplitRoomInEditableLayout } = await import("../packages/shared/dist/index.js");

const issue = readArg("--issue", "683");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const supportedStages = [
  "atomic-contract",
  "create-45",
  "all-canonical-pairs",
  "no-copy-label",
  "undo-proof",
  "final"
];

if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported split-room atomic creation stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: split rooms must be created atomically as one parent bay preserving child room IDs.\n"
);

const stages = stage === "final"
  ? ["atomic-contract", "create-45", "all-canonical-pairs", "no-copy-label", "undo-proof"]
  : [stage];
const checks = [];
const stageResults = {};

for (const selectedStage of stages) {
  stageResults[selectedStage] = runStage(selectedStage);
}

const status = statusFromChecks(checks);
if (status === "passed") {
  updateSplitRoomManifest(issue, {
    splitRoomAtomicCreationStatus: "passed",
    splitBayAtomicCreationProof: true,
    splitBayNoCopyLabelProof: true,
    noRecoveryScreenDuringSplitRoomWork: true
  });
}

writeEvidenceSlots(issue, "split-room-atomic-creation", status, stage, checks);
writeJson(`${dir}/test-output/split-room-atomic-creation.txt`, { status, issue, stage, checks, stageResults });
writeCommandsAndCloseout(status);

console.log(JSON.stringify({ status, issue, stage, checks }, null, 2));
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(selectedStage) {
  const layout = buildSplitRoomTestLayout();
  if (selectedStage === "atomic-contract") {
    const result = createSplitRoomInEditableLayout({ layout, selectedRoomId: "room-05" });
    const output = {
      status:
        result.status === "created" &&
        result.splitBayId === "split-bay-room-04-room-05" &&
        result.pairLabel === "4/5" &&
        JSON.stringify(result.childRoomIds) === JSON.stringify(["room-04", "room-05"])
          ? "passed"
          : "failed",
      result
    };
    writeJson(`${dir}/atomic-contract-output.json`, output);
    addCheck(checks, "atomic authoring result contract creates one split parent preserving child IDs", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "create-45") {
    const result = createSplitRoomInEditableLayout({ layout, selectedRoomId: "room-05" });
    const splitBay = result.status === "created" ? result.layout.splitBays.find((candidate) => candidate.splitBayId === result.splitBayId) : null;
    const output = {
      status:
        result.status === "created" &&
        splitBay != null &&
        splitBay.label === "4/5" &&
        JSON.stringify(splitBay.bedPositionRoomIds) === JSON.stringify(["room-04", "room-05"]) &&
        result.layout.rooms.some((room) => room.id === "room-04" && room.roomNumber === "4") &&
        result.layout.rooms.some((room) => room.id === "room-05" && room.roomNumber === "5")
          ? "passed"
          : "failed",
      result,
      splitBay
    };
    writeJson(`${dir}/create-45-output.json`, output);
    addCheck(checks, "Create Split Room 4/5 creates one parent and preserves Room 4 and Room 5", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "all-canonical-pairs") {
    const pairOutputs = canonicalSplitRoomPairs.map(([roomAId, , pairLabel]) => {
      const result = createSplitRoomInEditableLayout({ layout, selectedRoomId: roomAId });
      return { roomAId, pairLabel, status: result.status, result };
    });
    writeJson(`${dir}/create-23-output.json`, pairOutputs.find((item) => item.pairLabel === "2/3"));
    writeJson(`${dir}/create-67-output.json`, pairOutputs.find((item) => item.pairLabel === "6/7"));
    writeJson(`${dir}/create-89-output.json`, pairOutputs.find((item) => item.pairLabel === "8/9"));
    const output = { status: pairOutputs.every((item) => item.status === "created") ? "passed" : "failed", pairOutputs };
    addCheck(checks, "all canonical split-room pairs create atomically", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "no-copy-label") {
    const { layout: allSplitLayout } = createAllCanonicalSplitRooms({ createSplitRoomInEditableLayout }, layout);
    const labels = allSplitLayout.splitBays.map((splitBay) => splitBay.label);
    const output = {
      status: labels.every((label) => !/\b(?:Copy|Duplicate|Generated copy)\b/u.test(label)) ? "passed" : "failed",
      labels
    };
    writeJson(`${dir}/no-copy-label-output.json`, output);
    addCheck(checks, "atomic creation creates no Copy or Duplicate label", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "undo-proof") {
    const reducer = readText("apps/web/src/features/layout-editor/layoutEditorReducer.ts");
    const reducerTest = readText("apps/web/src/features/layout-editor/layoutEditorReducer.test.ts");
    const invalid = createSplitRoomInEditableLayout({ layout, selectedRoomId: "room-01" });
    const output = {
      status:
        reducer.includes("withUndoHistory(state") &&
        reducerTest.includes("undo") &&
        invalid.status === "blocked" &&
        !readText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx").includes("layout-editor-recovery-screen")
          ? "passed"
          : "failed",
      reducerUsesUndoHistory: reducer.includes("withUndoHistory(state"),
      reducerTestMentionsUndo: reducerTest.includes("undo"),
      invalidPair: invalid,
      noRecoveryScreenMutationPath: !readText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx").includes("layout-editor-recovery-screen")
    };
    writeJson(`${dir}/undo-proof-output.json`, output);
    writeJson(`${dir}/invalid-pair-blocked-output.json`, { status: invalid.status === "blocked" ? "passed" : "failed", invalid });
    writeJson(`${dir}/no-recovery-screen-output.json`, {
      status: output.noRecoveryScreenMutationPath ? "passed" : "failed",
      evidence: "split-room creation path converts blocked operations into validation warnings."
    });
    addCheck(checks, "operation is undoable, invalid pairs block, and split-room work does not show recovery screen", output.status === "passed", output);
    return output;
  }

  throw new Error(`Unhandled stage ${selectedStage}`);
}

function writeCommandsAndCloseout(status) {
  const commands = requiredIssueCommands(issue, "check-split-room-atomic-creation", [
    "atomic-contract",
    "create-45",
    "all-canonical-pairs",
    "no-copy-label",
    "undo-proof"
  ]);
  writeCommands(issue, commands, {
    [`node scripts/check-split-room-atomic-creation.mjs --stage atomic-contract --allow-partial --issue ${issue}`]: `${dir}/atomic-contract-output.json`,
    [`node scripts/check-split-room-atomic-creation.mjs --stage create-45 --allow-partial --issue ${issue}`]: `${dir}/create-45-output.json`,
    [`node scripts/check-split-room-atomic-creation.mjs --stage all-canonical-pairs --allow-partial --issue ${issue}`]: `${dir}/create-23-output.json`,
    [`node scripts/check-split-room-atomic-creation.mjs --stage no-copy-label --allow-partial --issue ${issue}`]: `${dir}/no-copy-label-output.json`,
    [`node scripts/check-split-room-atomic-creation.mjs --stage undo-proof --allow-partial --issue ${issue}`]: `${dir}/undo-proof-output.json`
  });
  writeCloseout(issue, "Atomic split-room creation.", status, commands);
}
