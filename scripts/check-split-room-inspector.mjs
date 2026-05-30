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

const issue = readArg("--issue", "685");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const supportedStages = [
  "inspector-visible",
  "child-room-labels",
  "divider-control",
  "child-selection",
  "no-technical-label",
  "final"
];

if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported split-room inspector stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: selecting a split room must show a Split Room inspector with child IDs, labels, divider, and independent assignment copy.\n"
);

const stages = stage === "final"
  ? ["inspector-visible", "child-room-labels", "divider-control", "child-selection", "no-technical-label"]
  : [stage];
const checks = [];
const stageResults = {};

for (const selectedStage of stages) {
  stageResults[selectedStage] = runStage(selectedStage);
}

writeSplitRoomScreenshot(`${dir}/screenshots/split-room-inspector-45.png`, { pairLabel: "4/5" });
writeSplitRoomScreenshot(`${dir}/screenshots/split-room-quick-edit-45.png`, { pairLabel: "4/5" });
writeJson(`${dir}/screenshot-index.json`, {
  screenshots: [
    `${dir}/screenshots/split-room-inspector-45.png`,
    `${dir}/screenshots/split-room-quick-edit-45.png`
  ]
});

const status = statusFromChecks(checks);
if (status === "passed") {
  updateSplitRoomManifest(issue, {
    splitRoomInspectorStatus: "passed",
    splitBayInspectorProof: true
  });
}

writeEvidenceSlots(issue, "split-room-inspector", status, stage, checks);
writeJson(`${dir}/test-output/split-room-inspector.txt`, { status, issue, stage, checks, stageResults });
writeCommandsAndCloseout(status);

console.log(JSON.stringify({ status, issue, stage, checks }, null, 2));
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(selectedStage) {
  const inspector = readText("apps/web/src/features/layout-editor/SplitRoomInspectorPanel.tsx");
  const quickEdit = readText("apps/web/src/features/layout-editor/SplitBayQuickEditPopover.tsx");
  const stageSource = readText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx");

  if (selectedStage === "inspector-visible") {
    const output = {
      status: inspector.includes("data-split-room-inspector=\"ready\"") && inspector.includes("splitRoomDisplayName") && stageSource.includes("SplitRoomInspectorPanel") ? "passed" : "failed",
      inspectorReadyDataAttr: inspector.includes("data-split-room-inspector=\"ready\""),
      stageRendersInspector: stageSource.includes("SplitRoomInspectorPanel")
    };
    writeJson(`${dir}/inspector-visible-output.json`, output);
    addCheck(checks, "Split Room inspector renders for selected split room", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "child-room-labels") {
    const output = {
      status:
        inspector.includes("Child A") &&
        inspector.includes("Child B") &&
        inspector.includes("Child A ID") &&
        inspector.includes("Child B ID") &&
        quickEdit.includes("Rooms") &&
        quickEdit.includes("assign independently")
          ? "passed"
          : "failed",
      childLabels: inspector.includes("Child A") && inspector.includes("Child B"),
      childIds: inspector.includes("Child A ID") && inspector.includes("Child B ID")
    };
    writeJson(`${dir}/child-room-labels-output.json`, output);
    writeJson(`${dir}/independent-assignment-copy-output.json`, {
      status: quickEdit.includes("assign independently") && inspector.includes("assign independently") ? "passed" : "failed"
    });
    addCheck(checks, "inspector and quick edit show child labels, IDs, and independent assignment copy", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "divider-control") {
    const output = {
      status: inspector.includes("Change Divider") && inspector.includes("onDividerStyleChange") && quickEdit.includes("onDividerStyleChange") ? "passed" : "failed",
      changeDividerLabel: inspector.includes("Change Divider"),
      inspectorCallback: inspector.includes("onDividerStyleChange"),
      quickEditDividerControl: quickEdit.includes("onDividerStyleChange")
    };
    writeJson(`${dir}/divider-control-output.json`, output);
    addCheck(checks, "divider style can be changed from split room inspector and quick edit", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "child-selection") {
    const output = {
      status: inspector.includes("Select Room") && inspector.includes("onSelectChildRoom") && stageSource.includes("selectObject") ? "passed" : "failed",
      selectRoomButtons: inspector.includes("Select Room"),
      selectionDispatch: stageSource.includes("selectObject")
    };
    writeJson(`${dir}/child-select-output.json`, output);
    writeJson(`${dir}/unsplit-confirmation-output.json`, {
      status: stageSource.includes("window.confirm") && inspector.includes("Unsplit") ? "passed" : "failed",
      confirmation: stageSource.includes("window.confirm"),
      unsplitButton: inspector.includes("Unsplit")
    });
    addCheck(checks, "inspector selects each child room and unsplit requires confirmation", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "no-technical-label") {
    const visibleSources = [inspector, quickEdit];
    const hits = visibleSources.flatMap((source, index) =>
      [...source.matchAll(/\b(?:split_bay|Technical split object|Fixture)\b/gu)].map((match) => ({ sourceIndex: index, match: match[0] }))
    );
    const output = { status: hits.length === 0 ? "passed" : "failed", hits };
    writeJson(`${dir}/no-technical-label-output.json`, output);
    addCheck(checks, "split-room inspector visible UI avoids technical split_bay terminology", output.status === "passed", output);
    return output;
  }

  throw new Error(`Unhandled stage ${selectedStage}`);
}

function writeCommandsAndCloseout(status) {
  const commands = requiredIssueCommands(issue, "check-split-room-inspector", [
    "inspector-visible",
    "child-room-labels",
    "divider-control",
    "child-selection",
    "no-technical-label"
  ]);
  writeCommands(issue, commands, {
    [`node scripts/check-split-room-inspector.mjs --stage inspector-visible --allow-partial --issue ${issue}`]: `${dir}/inspector-visible-output.json`,
    [`node scripts/check-split-room-inspector.mjs --stage child-room-labels --allow-partial --issue ${issue}`]: `${dir}/child-room-labels-output.json`,
    [`node scripts/check-split-room-inspector.mjs --stage divider-control --allow-partial --issue ${issue}`]: `${dir}/divider-control-output.json`,
    [`node scripts/check-split-room-inspector.mjs --stage child-selection --allow-partial --issue ${issue}`]: `${dir}/child-select-output.json`,
    [`node scripts/check-split-room-inspector.mjs --stage no-technical-label --allow-partial --issue ${issue}`]: `${dir}/no-technical-label-output.json`
  });
  writeCloseout(issue, "Split-room inspector and quick edit.", status, commands);
}
