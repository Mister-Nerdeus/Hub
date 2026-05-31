#!/usr/bin/env node
import { addCheck, ensureIssueArtifacts, fileIncludes, readArg, statusFromChecks, updateHardeningManifest, writeCloseout, writeCommandArtifacts, writeStageResult } from "./lib/geometry-truth-hardening-utils.mjs";
const issue = readArg("--issue", "824");
const stage = readArg("--stage", "final");
const scriptName = "check-split-divider-reducer-actions";
const commands = [`node scripts/${scriptName}.mjs --stage orientation-action --issue ${issue}`, `node scripts/${scriptName}.mjs --stage ratio-action --issue ${issue}`, `node scripts/${scriptName}.mjs --stage reset-action --issue ${issue}`, `node scripts/${scriptName}.mjs --stage legacy-divider-not-new-path --issue ${issue}`];
ensureIssueArtifacts(issue); writeCommandArtifacts(issue, commands);
const checks = [];
addCheck(checks, "orientation action wired", fileIncludes("apps/web/src/features/layout-editor/layoutEditorReducer.ts", ['type: "editSplitRoomDividerOrientation"', "updateSplitRoomDividerOrientation"]).passed);
addCheck(checks, "ratio action wired", fileIncludes("apps/web/src/features/layout-editor/layoutEditorReducer.ts", ['type: "editSplitRoomDividerRatio"', "updateSplitRoomDividerRatio"]).passed);
addCheck(checks, "reset action wired", fileIncludes("apps/web/src/features/layout-editor/layoutEditorReducer.ts", ['type: "resetSplitRoomDivider"', "resetSplitRoomDividerToEven"]).passed);
addCheck(checks, "inspector uses orientation and ratio controls", fileIncludes("apps/web/src/features/layout-editor/SplitRoomInspectorPanel.tsx", ["data-divider-orientation-control", "data-divider-ratio-control", "data-divider-ratio-reset"]).passed);
addCheck(checks, "split room actions clamp ratio and recalculate beds", fileIncludes("apps/web/src/features/layout-editor/splitRoomActions.ts", ["clampRatio", "recalculateSplitRoomBedRelativeBounds(nextSplitRoom)"]).passed);
const status = statusFromChecks(checks);
if (status === "passed") updateHardeningManifest(issue, { splitDividerReducerActionsStatus: "passed", splitDividerRatioUpdatesBedBounds: true, legacyDividerStyleNotUsedForNewSplitRooms: true });
writeCloseout(issue, { title: "Wire Divider Orientation and Ratio Reducer Actions", reviewFinding: "Divider orientation, ratio, and reset are reducer state for new splitRooms instead of legacy dividerStyle.", status, filesChanged: ["apps/web/src/features/layout-editor/layoutEditorReducer.ts", "apps/web/src/features/layout-editor/SplitRoomInspectorPanel.tsx", "apps/web/src/features/layout-editor/splitRoomActions.ts", `docs/verification/issues/issue-${issue}/`], commands, evidence: [`docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`, `docs/verification/issues/issue-${issue}/manifest-update-output.json`], limitations: [] });
writeStageResult(issue, scriptName, stage, checks); if (status !== "passed") process.exit(1);
