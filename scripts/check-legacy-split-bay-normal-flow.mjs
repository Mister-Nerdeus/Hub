#!/usr/bin/env node
import { addCheck, ensureIssueArtifacts, fileExcludes, fileIncludes, readArg, statusFromChecks, updateHardeningManifest, writeCloseout, writeCommandArtifacts, writeStageResult } from "./lib/geometry-truth-hardening-utils.mjs";

const issue = readArg("--issue", "818");
const stage = readArg("--stage", "final");
const scriptName = "check-legacy-split-bay-normal-flow";
const commands = [
  `node scripts/${scriptName}.mjs --stage normal-flow-clean --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage legacy-only-if-marked --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage no-pair-split-dispatch-normal --issue ${issue}`
];
ensureIssueArtifacts(issue);
writeCommandArtifacts(issue, commands);
const checks = [];
addCheck(checks, "normal handler uses split-room naming", fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", ["const convertSelectedRoomToSplitRoom", "onAddSplitRoom={convertSelectedRoomToSplitRoom}", "onCreateSplitRoom={convertSelectedRoomToSplitRoom}"]).passed);
addCheck(checks, "normal editor does not dispatch pair split-bay action", fileExcludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", ["convertSelectedRoomPairToSplitBay", "convertSelectedRoomToSplitBay", "SplitBayShape", "SplitBayQuickEditPopover", "buildSplitBayQuickEdit"]).passed);
addCheck(checks, "legacy reducer path is explicitly marked compatibility-only", fileIncludes("apps/web/src/features/layout-editor/layoutEditorReducer.ts", ["Legacy split-bay compatibility path only", "convertSelectedRoomToSplitRoom"]).passed);
const status = statusFromChecks(checks);
if (status === "passed") updateHardeningManifest(issue, { legacySplitBayNormalFlowStatus: "passed", normalEditorDoesNotDispatchPairSplitBayAction: true, normalAddSplitRoomUsesSplitRoomNaming: true });
writeCloseout(issue, { title: "Remove Legacy Split-Bay Action from Normal Editor Flow", reviewFinding: "Normal Add Split Room now dispatches single-room split-room conversion and no longer imports or renders legacy split-bay quick-edit flow.", status, filesChanged: ["apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "apps/web/src/features/layout-editor/layoutEditorReducer.ts", `docs/verification/issues/issue-${issue}/`], commands, evidence: [`docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`, `docs/verification/issues/issue-${issue}/manifest-update-output.json`], limitations: ["Legacy split-bay reducer support remains only for compatibility with older data."] });
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);
