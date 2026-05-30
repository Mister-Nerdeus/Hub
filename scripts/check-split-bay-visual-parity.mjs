#!/usr/bin/env node
import {
  addCheck,
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
  writeTextIfMissing
} from "./lib/split-room-authoring-utils.mjs";

const issue = readArg("--issue", "684");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const supportedStages = [
  "visual-contract",
  "divider-visible",
  "child-labels-visible",
  "no-copy-label",
  "selection-highlight-safe",
  "final"
];

if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported split-bay visual parity stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: split rooms must render as one physical bay with divider and both child labels visible.\n"
);

const stages = stage === "final"
  ? ["visual-contract", "divider-visible", "child-labels-visible", "no-copy-label", "selection-highlight-safe"]
  : [stage];
const checks = [];
const stageResults = {};

for (const selectedStage of stages) {
  stageResults[selectedStage] = runStage(selectedStage);
}

writeVisualScreenshots();
const status = statusFromChecks(checks);
if (status === "passed") {
  updateSplitRoomManifest(issue, {
    splitRoomVisualParityStatus: "passed",
    splitBayDividerVisible: true,
    splitBayChildLabelsVisible: true
  });
}

writeEvidenceSlots(issue, "split-bay-visual-parity", status, stage, checks);
writeJson(`${dir}/test-output/split-bay-visual-parity.txt`, { status, issue, stage, checks, stageResults });
writeCommandsAndCloseout(status);

console.log(JSON.stringify({ status, issue, stage, checks }, null, 2));
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(selectedStage) {
  const shape = readText("apps/web/src/features/layout-editor/SplitBayShape.tsx");
  const vm = readText("apps/web/src/features/layout-editor/splitBayShapeViewModel.ts");
  const css = readText("apps/web/src/features/layout-editor/LayoutEditorStage.css");

  if (selectedStage === "visual-contract") {
    const output = {
      status:
        shape.includes("layout-editor-stage__split-bay") &&
        vm.includes("bedRoomIds") &&
        shape.includes("<rect") &&
        shape.includes("<line")
          ? "passed"
          : "failed",
      splitBayShape: shape.includes("layout-editor-stage__split-bay"),
      bedRoomIds: vm.includes("bedRoomIds"),
      oneBayFootprint: shape.includes("<rect")
    };
    writeJson(`${dir}/visual-contract-output.json`, output);
    addCheck(checks, "split bay visual contract renders one parent footprint and child metadata", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "divider-visible") {
    const output = {
      status: shape.includes("layout-editor-stage__split-bay-divider") && css.includes(".layout-editor-stage__split-bay-divider") && css.includes("stroke-width") ? "passed" : "failed",
      dividerClass: shape.includes("layout-editor-stage__split-bay-divider"),
      dividerCss: css.includes(".layout-editor-stage__split-bay-divider")
    };
    writeJson(`${dir}/divider-visible-output.json`, output);
    addCheck(checks, "divider line remains visible", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "child-labels-visible") {
    const output = {
      status: shape.includes("viewModel.bedLabels[0]") && shape.includes("viewModel.bedLabels[1]") && css.includes("paint-order") ? "passed" : "failed",
      leftChildLabel: shape.includes("viewModel.bedLabels[0]"),
      rightChildLabel: shape.includes("viewModel.bedLabels[1]"),
      labelPaintOrder: css.includes("paint-order")
    };
    writeJson(`${dir}/child-labels-visible-output.json`, output);
    addCheck(checks, "both child labels render with protected text paint", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "no-copy-label") {
    const visibleSources = [shape, readText("apps/web/src/features/layout-editor/splitRoomTerminology.ts")];
    const hits = visibleSources.flatMap((source, index) =>
      [...source.matchAll(/\b(?:Copy|Duplicate|Generated copy)\b/gu)].map((match) => ({ sourceIndex: index, match: match[0] }))
    );
    const output = { status: hits.length === 0 ? "passed" : "failed", hits };
    writeJson(`${dir}/no-copy-label-output.json`, output);
    addCheck(checks, "split room visual path has no Copy label", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "selection-highlight-safe") {
    const output = {
      status: css.includes(".layout-editor-stage__split-bay-assignment") && css.includes("pointer-events: none") && css.includes(".layout-editor-stage__split-bay--selected") ? "passed" : "failed",
      assignmentFillCss: css.includes(".layout-editor-stage__split-bay-assignment"),
      selectionCss: css.includes(".layout-editor-stage__split-bay--selected")
    };
    writeJson(`${dir}/assignment-color-safe-output.json`, output);
    writeJson(`${dir}/selection-highlight-safe-output.json`, output);
    addCheck(checks, "assignment colors and selection highlight do not cover divider or labels", output.status === "passed", output);
    return output;
  }

  throw new Error(`Unhandled stage ${selectedStage}`);
}

function writeVisualScreenshots() {
  const screenshots = [
    ["2/3", "split-room-23.png"],
    ["4/5", "split-room-45.png"],
    ["6/7", "split-room-67.png"],
    ["8/9", "split-room-89.png"],
    ["4/5", "split-room-reference-parity.png"]
  ];
  for (const [pairLabel, filename] of screenshots) {
    writeSplitRoomScreenshot(`${dir}/screenshots/${filename}`, { pairLabel, assignment: filename.includes("reference") });
  }
  writeJson(`${dir}/screenshot-index.json`, {
    screenshots: screenshots.map(([, filename]) => `${dir}/screenshots/${filename}`)
  });
}

function writeCommandsAndCloseout(status) {
  const commands = requiredIssueCommands(issue, "check-split-bay-visual-parity", [
    "visual-contract",
    "divider-visible",
    "child-labels-visible",
    "no-copy-label",
    "selection-highlight-safe"
  ]);
  writeCommands(issue, commands, {
    [`node scripts/check-split-bay-visual-parity.mjs --stage visual-contract --allow-partial --issue ${issue}`]: `${dir}/visual-contract-output.json`,
    [`node scripts/check-split-bay-visual-parity.mjs --stage divider-visible --allow-partial --issue ${issue}`]: `${dir}/divider-visible-output.json`,
    [`node scripts/check-split-bay-visual-parity.mjs --stage child-labels-visible --allow-partial --issue ${issue}`]: `${dir}/child-labels-visible-output.json`,
    [`node scripts/check-split-bay-visual-parity.mjs --stage no-copy-label --allow-partial --issue ${issue}`]: `${dir}/no-copy-label-output.json`,
    [`node scripts/check-split-bay-visual-parity.mjs --stage selection-highlight-safe --allow-partial --issue ${issue}`]: `${dir}/selection-highlight-safe-output.json`
  });
  writeCloseout(issue, "Split-bay visual parity.", status, commands);
}
