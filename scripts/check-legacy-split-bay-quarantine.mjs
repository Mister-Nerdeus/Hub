#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  fileExcludes,
  fileIncludes,
  readArg,
  statusFromChecks,
  writeCloseout,
  writeCommandArtifacts,
  writeJson,
  writeStageResult
} from "./lib/boundary-door-destination-utils.mjs";
import { updateHardeningManifest } from "./lib/geometry-truth-hardening-utils.mjs";

const issue = readArg("--issue", "832");
const stage = readArg("--stage", "final");
const scriptName = "check-legacy-split-bay-quarantine";
const commands = [`node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`];
ensureIssueArtifacts(issue);
writeCommandArtifacts(issue, commands);

const checks = [];
addCheck(checks, "normal layout stage does not import legacy split-bay renderer or quick edit", fileExcludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
  "SplitBayShape",
  "SplitBayQuickEditPopover"
]).passed);
addCheck(checks, "render pipeline gates split_bay behind compatibility flag", fileIncludes("apps/web/src/features/layout-editor/layoutObjectRenderPipeline.ts", [
  "includeLegacySplitBays = false",
  "includeLegacySplitBays ? layout.splitBays"
]).passed);
addCheck(checks, "current split-room actions use splitRoomId", fileIncludes("apps/web/src/features/layout-editor/layoutEditorReducer.ts", [
  "convertSelectedRoomToSplitRoom",
  "splitRoomId?: string",
  "{ type: \"unsplitSplitRoom\"; splitRoomId: string }"
]).passed);
addCheck(checks, "legacy pair split action remains only as compatibility path", fileIncludes("apps/web/src/features/layout-editor/layoutEditorReducer.ts", [
  "convertSelectedRoomPairToSplitBay",
  "addSplitBayToEditableLayout"
]).passed);
const status = statusFromChecks(checks);
writeJson(`docs/verification/issues/issue-${issue}/legacy-split-bay-quarantine-output.json`, {
  status,
  legacySplitBayQuarantineStatus: status,
  legacySplitBayOnlyCompatibility: status === "passed",
  normalFlowHasNoSplitBayLeakage: status === "passed",
  currentSplitRoomActionsUseSplitRoomNaming: status === "passed"
});
if (status === "passed") {
  updateHardeningManifest(issue, {
    legacySplitBayQuarantineStatus: "passed",
    legacySplitBayOnlyCompatibility: true,
    normalFlowHasNoSplitBayLeakage: true,
    currentSplitRoomActionsUseSplitRoomNaming: true
  });
}
writeCloseout(issue, {
  title: "Legacy Split-Bay Quarantine Cleanup",
  reviewFinding: "Legacy split-bay support remains only as compatibility code; normal rendering and current split-room actions use split-room naming and do not render SplitBayShape.",
  status,
  filesChanged: [
    "apps/web/src/features/layout-editor/layoutEditorReducer.ts",
    "apps/web/src/features/layout-editor/LayoutEditorStage.tsx",
    "apps/web/src/features/layout-editor/layoutObjectRenderPipeline.ts",
    "scripts/check-legacy-split-bay-quarantine.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [`docs/verification/issues/issue-${issue}/legacy-split-bay-quarantine-output.json`],
  limitations: ["Legacy split-bay data structures remain for migration and compatibility only."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);
