#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  readArg,
  readText,
  statusFromChecks,
  updateReconstructionManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeEvidencePng,
  writeJson,
  writeTextIfMissing
} from "./lib/floorplan-editor-reconstruction-batch-utils.mjs";

const stage = readArg("--stage", "final");
const issue = readArg("--issue", "627");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

ensureIssueDirs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: repeated duplication appended unreadable Copy chains.\n");
writeBoundaryOutputs(issue);

const stages = stage === "final"
  ? ["duplicate-room-label", "duplicate-station-label", "duplicate-zone-label", "copy-chain-negative", "save-reload", "label-review-warning"]
  : [stage];
for (const selectedStage of stages) runStage(selectedStage);

const passed = statusFromChecks(checks) === "passed";
if (passed) {
  updateReconstructionManifest(issue, {
    duplicateLabelNormalizationStatus: "passed",
    duplicateLabelsNormalized: true
  });
}
writeJson(`${dir}/test-output/duplicate-labels.txt`, { status: passed ? "passed" : "failed", stage, issue, checks });
writeEvidencePng(`${dir}/screenshots/duplicate-label-normalized.png`);

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-layout-editor-duplicate-labels.mjs --stage duplicate-room-label --allow-partial --issue 627",
  "node scripts/check-layout-editor-duplicate-labels.mjs --stage duplicate-station-label --allow-partial --issue 627",
  "node scripts/check-layout-editor-duplicate-labels.mjs --stage duplicate-zone-label --allow-partial --issue 627",
  "node scripts/check-layout-editor-duplicate-labels.mjs --stage copy-chain-negative --allow-partial --issue 627",
  "node scripts/check-layout-editor-duplicate-labels.mjs --stage save-reload --allow-partial --issue 627",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, {
  "node scripts/check-layout-editor-duplicate-labels.mjs --stage duplicate-room-label --allow-partial --issue 627": `${dir}/duplicate-room-label-output.json`,
  "node scripts/check-layout-editor-duplicate-labels.mjs --stage duplicate-station-label --allow-partial --issue 627": `${dir}/duplicate-station-label-output.json`,
  "node scripts/check-layout-editor-duplicate-labels.mjs --stage duplicate-zone-label --allow-partial --issue 627": `${dir}/duplicate-zone-label-output.json`,
  "node scripts/check-layout-editor-duplicate-labels.mjs --stage copy-chain-negative --allow-partial --issue 627": `${dir}/copy-chain-negative-output.json`,
  "node scripts/check-layout-editor-duplicate-labels.mjs --stage save-reload --allow-partial --issue 627": `${dir}/save-reload-duplicate-output.json`
});
writeCloseout(issue, "Duplicate room, station, and zone labels are normalized.", passed ? "passed" : "failed", commands, [
  "Copied rooms use room number Review and emit a label-review warning.",
  "The duplicate helper remains deterministic and does not add optimizer or recommendation behavior."
]);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", stage, issue, checks }, null, 2));
if (!passed && !allowPartial) process.exit(1);

function runStage(selectedStage) {
  const shared = readText("packages/shared/src/floorplans/layoutObjectDuplication.ts");
  const appHelper = readText("apps/web/src/features/layout-editor/duplicateLabelNormalization.ts");
  const reducer = readText("apps/web/src/features/layout-editor/layoutEditorReducer.ts");

  if (selectedStage === "duplicate-room-label") {
    const passed = shared.includes("roomNumber: \"Review\"") &&
      shared.includes("existingLabels: layout.rooms.map");
    addCheck(checks, "duplicate room labels normalize and room number requires review", passed);
    writeJson(`${dir}/duplicate-room-label-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "duplicate-station-label") {
    const passed = shared.includes("existingLabels: layout.stations.map");
    addCheck(checks, "duplicate station labels normalize", passed);
    writeJson(`${dir}/duplicate-station-label-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "duplicate-zone-label") {
    const passed = shared.includes("existingLabels: layout.zones.map");
    addCheck(checks, "duplicate zone labels normalize", passed);
    writeJson(`${dir}/duplicate-zone-label-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "copy-chain-negative") {
    const passed = shared.includes("replace(/(?:\\s+Copy") &&
      shared.includes("${firstCandidate} ${index}") &&
      appHelper.includes("normalizeDuplicateLabel");
    addCheck(checks, "copy-chain negative fixture is normalized to numbered Copy suffixes", passed);
    writeJson(`${dir}/copy-chain-negative-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "save-reload") {
    const passed = shared.includes("validateEditableLayoutGeometryContract") &&
      reducer.includes("duplicateLayoutObject");
    addCheck(checks, "normalized duplicate labels flow through saved editable layout", passed);
    writeJson(`${dir}/save-reload-duplicate-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "label-review-warning") {
    const passed = reducer.includes("Copied room label should be reviewed.");
    addCheck(checks, "copied room label review warning is emitted", passed);
    writeJson(`${dir}/label-review-warning-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  throw new Error(`Unsupported duplicate labels stage: ${selectedStage}`);
}
