#!/usr/bin/env node
import { readFileSync } from "node:fs";
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

const issue = readArg("--issue", "664");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const supportedStages = ["render", "diagonal-divider", "bed-labels-from-rooms", "selection", "final"];
if (!supportedStages.includes(stage)) throw new Error(`Unsupported stage: ${stage}`);

const dir = issueDir(issue);
const checks = [];
const blockers = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: split bays must render as one physical bay with divider and bed-position labels from referenced rooms.\n"
);

const shapeSource = readFileSync("apps/web/src/features/layout-editor/SplitBayShape.tsx", "utf8");
const viewModelSource = readFileSync("apps/web/src/features/layout-editor/splitBayShapeViewModel.ts", "utf8");
const stageSource = readFileSync("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "utf8");
const cssSource = readFileSync("apps/web/src/features/layout-editor/LayoutEditorStage.css", "utf8");

if (stage === "render" || stage === "final") {
  addCheck(checks, "split bay renders as one physical bay outline", shapeSource.includes("<rect") && shapeSource.includes('data-layout-object-type="split_bay"') && stageSource.includes("SplitBayShape"));
}
if (stage === "diagonal-divider" || stage === "final") {
  addCheck(checks, "diagonal, vertical, and horizontal divider styles render", shapeSource.includes('dividerStyle === "vertical"') && shapeSource.includes('dividerStyle === "horizontal"') && shapeSource.includes("yPixels + heightPixels"));
}
if (stage === "bed-labels-from-rooms" || stage === "final") {
  addCheck(checks, "split bay bed labels are derived from referenced rooms", viewModelSource.includes("bedPositionRoomIds") && viewModelSource.includes("roomNumber") && shapeSource.includes("bedLabels[0]") && shapeSource.includes("bedLabels[1]"));
}
if (stage === "selection" || stage === "final") {
  addCheck(checks, "split bay and bed-position selection states are visually distinct", shapeSource.includes("selectedClassName") && cssSource.includes("split-bay--selected") && stageSource.includes("selectedSplitBay"));
}

const passed = statusFromChecks(checks) === "passed";
if (!passed) blockers.push("Split-bay renderer proof is incomplete.");

updateAuthoringReadinessManifest(issue, {
  splitBayRendererStatus: passed ? "passed" : "failed",
  splitBayDiagonalRendererSupported: passed,
  reconstructionStatus: "no_go_until_runtime_saved_copy_support_access_and_split_bay_pass",
  goNoGoStatus: "not_ready"
});

writeJson(`${dir}/split-bay-renderer-output.json`, { status: passed ? "passed" : "failed", stage });
writeIssueResult({
  issue,
  scriptName: "check-split-bay-renderer",
  stage,
  status: passed ? "passed" : "failed",
  checks,
  blockers,
  commands: requiredAcceptanceCommands(issue, "check-split-bay-renderer", supportedStages.filter((value) => value !== "final")),
  title: "Split-bay renderer shows one physical bay, divider styles, room-derived bed labels, and selection state.",
  limitations: ["Manual visual review remains required; this script does not claim CAD exactness."]
});

console.log(JSON.stringify({ status: passed ? "passed" : "failed", issue, stage, blockers }, null, 2));
if (!passed && !allowPartial) process.exit(1);
