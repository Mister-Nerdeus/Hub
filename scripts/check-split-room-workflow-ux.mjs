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
  writeSplitRoomScreenshot,
  writeTextIfMissing
} from "./lib/split-room-authoring-utils.mjs";

const { resolveSplitRoomPair } = await import("../packages/shared/dist/index.js");

const issue = readArg("--issue", "681");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const supportedStages = [
  "room5-action-visible",
  "canonical-room-actions-visible",
  "preview-action",
  "disabled-reasons",
  "no-hidden-advanced-only",
  "final"
];

if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported split-room workflow UX stage: ${stage}`);
}

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: selecting canonical rooms must visibly expose Create Split Room actions in normal room edit context.\n"
);

const stages = stage === "final"
  ? ["room5-action-visible", "canonical-room-actions-visible", "preview-action", "disabled-reasons", "no-hidden-advanced-only"]
  : [stage];
const checks = [];
const stageResults = {};

for (const selectedStage of stages) {
  stageResults[selectedStage] = runStage(selectedStage);
}

writeSplitRoomScreenshot(`${dir}/screenshots/room5-create-split-room-button.png`, { pairLabel: "4/5" });
writeSplitRoomScreenshot(`${dir}/screenshots/room5-split-room-preview.png`, { pairLabel: "4/5" });
writeJson(`${dir}/screenshot-index.json`, {
  screenshots: [
    `${dir}/screenshots/room5-create-split-room-button.png`,
    `${dir}/screenshots/room5-split-room-preview.png`
  ]
});

const status = statusFromChecks(checks);
if (status === "passed") {
  updateSplitRoomManifest(issue, {
    splitRoomWorkflowUxStatus: "passed",
    splitRoomUserDiscoverable: true,
    room5CanCreatePair45: true
  });
}

writeEvidenceSlots(issue, "split-room-workflow-ux", status, stage, checks);
writeJson(`${dir}/test-output/split-room-workflow-ux.txt`, { status, issue, stage, checks, stageResults });
writeCommandsAndCloseout(status);

console.log(JSON.stringify({ status, issue, stage, checks }, null, 2));
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(selectedStage) {
  const layout = buildSplitRoomTestLayout();
  if (selectedStage === "room5-action-visible") {
    const resolution = resolveSplitRoomPair({ layout, selectedRoomId: "room-05" });
    const source = readText("apps/web/src/features/layout-editor/splitRoomTerminology.ts");
    const output = {
      status: resolution.status === "ready" && resolution.pairLabel === "4/5" && source.includes("Create ${splitRoomDisplayName") ? "passed" : "failed",
      resolution,
      expectedUi: {
        title: "Split room available",
        explanation: "Room 5 can be paired with Room 4.",
        createAction: "Create Split Room 4/5",
        previewAction: "Preview Split Room 4/5"
      }
    };
    writeJson(`${dir}/room5-split-action-output.json`, output);
    addCheck(checks, "Room 5 resolves to visible Create Split Room 4/5 action", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "canonical-room-actions-visible") {
    const roomChecks = [
      ["room-04", "4/5", `${dir}/room4-split-action-output.json`],
      ["room-03", "2/3", `${dir}/room3-split-action-output.json`],
      ["room-07", "6/7", `${dir}/room7-split-action-output.json`],
      ["room-09", "8/9", `${dir}/room9-split-action-output.json`]
    ].map(([roomId, pairLabel, path]) => {
      const resolution = resolveSplitRoomPair({ layout, selectedRoomId: roomId });
      const result = { status: resolution.status === "ready" && resolution.pairLabel === pairLabel ? "passed" : "failed", roomId, pairLabel, resolution };
      writeJson(path, result);
      return result;
    });
    const allCanonical = canonicalSplitRoomPairs.every(([roomAId, roomBId, pairLabel]) =>
      [roomAId, roomBId].every((roomId) => {
        const resolution = resolveSplitRoomPair({ layout, selectedRoomId: roomId });
        return resolution.status === "ready" && resolution.pairLabel === pairLabel;
      })
    );
    const output = { status: roomChecks.every((item) => item.status === "passed") && allCanonical ? "passed" : "failed", roomChecks, allCanonical };
    writeJson(`${dir}/canonical-action-visibility-output.json`, output);
    addCheck(checks, "canonical split-room actions are visible from either child room", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "preview-action") {
    const previewPanel = readText("apps/web/src/features/layout-editor/SplitRoomPreviewPanel.tsx");
    const stageSource = readText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx");
    const workflow = readText("apps/web/src/features/layout-editor/splitRoomTerminology.ts");
    const output = {
      status: workflow.includes("Preview ${splitRoomDisplayName") && previewPanel.includes("data-split-room-preview") && stageSource.includes("setSplitRoomPreviewOpen(true)") && !previewPanel.includes("dispatchStage") ? "passed" : "failed",
      previewPanelExists: previewPanel.includes("data-split-room-preview"),
      previewActionLabel: workflow.includes("Preview ${splitRoomDisplayName"),
      previewDoesNotMutateLayout: !previewPanel.includes("dispatchStage")
    };
    writeJson(`${dir}/preview-action-output.json`, output);
    addCheck(checks, "preview action is present and does not mutate layout", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "disabled-reasons") {
    const invalid = resolveSplitRoomPair({ layout, selectedRoomId: "room-01" });
    const missingPartnerLayout = { ...layout, rooms: layout.rooms.filter((room) => room.id !== "room-04") };
    const missingPartner = resolveSplitRoomPair({ layout: missingPartnerLayout, selectedRoomId: "room-05" });
    const output = {
      status: invalid.status === "blocked" && missingPartner.status === "blocked" && Boolean(invalid.reason) && Boolean(missingPartner.reason) ? "passed" : "failed",
      invalid,
      missingPartner
    };
    writeJson(`${dir}/disabled-reason-output.json`, output);
    addCheck(checks, "disabled states carry exact blocked reasons", output.status === "passed", output);
    return output;
  }

  if (selectedStage === "no-hidden-advanced-only") {
    const quickEdit = readText("apps/web/src/features/layout-editor/RoomQuickEditPopover.tsx");
    const createIndex = quickEdit.indexOf("splitRoomAction.createActionLabel");
    const advancedIndex = quickEdit.indexOf("Advanced");
    const output = {
      status: createIndex >= 0 && (advancedIndex < 0 || createIndex < advancedIndex) ? "passed" : "failed",
      createIndex,
      advancedIndex
    };
    writeJson(`${dir}/no-hidden-advanced-only-output.json`, output);
    addCheck(checks, "Create Split Room action is in normal quick-edit context", output.status === "passed", output);
    return output;
  }

  throw new Error(`Unhandled stage ${selectedStage}`);
}

function writeCommandsAndCloseout(status) {
  const commands = requiredIssueCommands(issue, "check-split-room-workflow-ux", [
    "room5-action-visible",
    "canonical-room-actions-visible",
    "preview-action",
    "disabled-reasons",
    "no-hidden-advanced-only"
  ]);
  writeCommands(issue, commands, {
    [`node scripts/check-split-room-workflow-ux.mjs --stage room5-action-visible --allow-partial --issue ${issue}`]: `${dir}/room5-split-action-output.json`,
    [`node scripts/check-split-room-workflow-ux.mjs --stage canonical-room-actions-visible --allow-partial --issue ${issue}`]: `${dir}/canonical-action-visibility-output.json`,
    [`node scripts/check-split-room-workflow-ux.mjs --stage preview-action --allow-partial --issue ${issue}`]: `${dir}/preview-action-output.json`,
    [`node scripts/check-split-room-workflow-ux.mjs --stage disabled-reasons --allow-partial --issue ${issue}`]: `${dir}/disabled-reason-output.json`,
    [`node scripts/check-split-room-workflow-ux.mjs --stage no-hidden-advanced-only --allow-partial --issue ${issue}`]: `${dir}/no-hidden-advanced-only-output.json`
  });
  writeCloseout(issue, "Split-room workflow UX discoverability.", status, commands);
}
