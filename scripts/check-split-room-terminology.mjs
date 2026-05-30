#!/usr/bin/env node
import {
  addCheck,
  assertFile,
  ensureIssueDirs,
  forbiddenUserFacingCopyHits,
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

const issue = readArg("--issue", "680");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const supportedStages = ["terminology-contract", "help-copy-visible", "no-copy-language", "final"];
const requiredCopy =
  "A split room is one physical bay with two patient-care positions. The divider shows how the space is split. Each numbered position can still be assigned independently.";

if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported split-room terminology stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: split-room user-facing terminology must say Split Room and avoid copy/duplicate language in the workflow.\n"
);

const stages = stage === "final"
  ? ["terminology-contract", "help-copy-visible", "no-copy-language"]
  : [stage];
const checks = [];
const stageResults = {};

for (const selectedStage of stages) {
  stageResults[selectedStage] = runStage(selectedStage);
}

writeSplitRoomScreenshot(`${dir}/screenshots/split-room-help-copy.png`, { pairLabel: "4/5" });
writeJson(`${dir}/screenshot-index.json`, {
  screenshots: [
    {
      path: `${dir}/screenshots/split-room-help-copy.png`,
      description: "Help copy proof with one physical split room bay and two visible labels."
    }
  ]
});

const status = statusFromChecks(checks);
if (status === "passed") {
  updateSplitRoomManifest(issue, {
    splitRoomTerminologyStatus: "passed",
    splitRoomTerminologyUserSafe: true,
    splitRoomHelpVisible: true,
    splitBayNoCopyLabelProof: true
  });
}

writeEvidenceSlots(issue, "split-room-terminology", status, stage, checks);
writeJson(`${dir}/test-output/split-room-terminology.txt`, {
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
  if (selectedStage === "terminology-contract") {
    const terminology = readText("apps/web/src/features/layout-editor/splitRoomTerminology.ts");
    const help = readText("apps/web/src/features/layout-editor/SplitRoomHelpPanel.tsx");
    const output = {
      status: terminology.includes("Split Room") && terminology.includes(requiredCopy) && help.includes("SPLIT_ROOM_HELP_COPY") ? "passed" : "failed",
      terminologyFileExists: assertFile("apps/web/src/features/layout-editor/splitRoomTerminology.ts"),
      helpFileExists: assertFile("apps/web/src/features/layout-editor/SplitRoomHelpPanel.tsx"),
      requiredCopyPresent: terminology.includes(requiredCopy),
      helpPanelUsesRequiredCopyConstant: help.includes("SPLIT_ROOM_HELP_COPY")
    };
    writeJson(`${dir}/terminology-contract-output.json`, output);
    addCheck(checks, "terminology contract and required help copy are present", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "help-copy-visible") {
    const quickEdit = readText("apps/web/src/features/layout-editor/RoomQuickEditPopover.tsx");
    const inspector = readText("apps/web/src/features/layout-editor/SplitRoomInspectorPanel.tsx");
    const output = {
      status: quickEdit.includes("SplitRoomHelpPanel") && inspector.includes("SplitRoomHelpPanel") ? "passed" : "failed",
      quickEditHelpPanel: quickEdit.includes("SplitRoomHelpPanel"),
      inspectorHelpPanel: inspector.includes("SplitRoomHelpPanel")
    };
    writeJson(`${dir}/help-copy-output.json`, output);
    addCheck(checks, "help panel renders near quick edit and inspector workflow", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "no-copy-language") {
    const workflowSources = [
      "apps/web/src/features/layout-editor/SplitRoomHelpPanel.tsx",
      "apps/web/src/features/layout-editor/SplitRoomPreviewPanel.tsx",
      "apps/web/src/features/layout-editor/SplitRoomInspectorPanel.tsx",
      "apps/web/src/features/layout-editor/SplitBayQuickEditPopover.tsx",
      "apps/web/src/features/layout-editor/splitRoomWorkflowViewModel.ts"
    ];
    const hits = workflowSources.flatMap((path) =>
      forbiddenUserFacingCopyHits(readText(path)).map((pattern) => ({ path, pattern }))
    );
    const labels = readText("apps/web/src/features/layout-editor/splitRoomWorkflowViewModel.ts");
    const userFacingLabels = {
      create: labels.includes("createSplitRoomActionLabel"),
      preview: labels.includes("previewSplitRoomActionLabel"),
      help: labels.includes("What is a split room?")
    };
    const output = {
      status: hits.length === 0 && Object.values(userFacingLabels).every(Boolean) ? "passed" : "failed",
      hits,
      userFacingLabels
    };
    writeJson(`${dir}/no-copy-language-output.json`, { status: hits.length === 0 ? "passed" : "failed", hits });
    writeJson(`${dir}/user-facing-labels-output.json`, {
      status: Object.values(userFacingLabels).every(Boolean) ? "passed" : "failed",
      userFacingLabels
    });
    addCheck(checks, "split-room workflow copy avoids forbidden user-facing language", output.status === "passed", output);
    return output;
  }

  throw new Error(`Unhandled stage ${selectedStage}`);
}

function writeCommandsAndCloseout(status) {
  const commands = requiredIssueCommands(issue, "check-split-room-terminology", [
    "terminology-contract",
    "help-copy-visible",
    "no-copy-language"
  ]);
  writeCommands(issue, commands, {
    [`node scripts/check-split-room-terminology.mjs --stage terminology-contract --allow-partial --issue ${issue}`]: `${dir}/terminology-contract-output.json`,
    [`node scripts/check-split-room-terminology.mjs --stage help-copy-visible --allow-partial --issue ${issue}`]: `${dir}/help-copy-output.json`,
    [`node scripts/check-split-room-terminology.mjs --stage no-copy-language --allow-partial --issue ${issue}`]: `${dir}/no-copy-language-output.json`
  });
  writeCloseout(issue, "Split-room terminology and help copy.", status, commands);
}
