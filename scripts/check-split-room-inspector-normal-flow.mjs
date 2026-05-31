#!/usr/bin/env node
import { addCheck, ensureIssueArtifacts, fileExcludes, fileIncludes, readArg, statusFromChecks, updateHardeningManifest, writeCloseout, writeCommandArtifacts, writeJson, writeStageResult } from "./lib/geometry-truth-hardening-utils.mjs";
const issue = readArg("--issue", "825");
const stage = readArg("--stage", "final");
const scriptName = "check-split-room-inspector-normal-flow";
const commands = [`node scripts/${scriptName}.mjs --stage no-split-bay-quick-edit-normal --issue ${issue}`, `node scripts/${scriptName}.mjs --stage split-room-inspector-used --issue ${issue}`, `node scripts/${scriptName}.mjs --stage bed-position-details --issue ${issue}`];
ensureIssueArtifacts(issue, { screenshots: true }); writeCommandArtifacts(issue, commands); writeJson(`docs/verification/issues/issue-${issue}/screenshot-index.json`, { status: "pending-hard-browser-proof", screenshots: [] });
const checks = [];
addCheck(checks, "normal stage does not import split-bay quick edit", fileExcludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", ["SplitBayQuickEditPopover", "buildSplitBayQuickEdit"]).passed);
addCheck(checks, "normal split selection uses SplitRoomInspectorPanel", fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", ["<SplitRoomInspectorPanel", 'selectedObjectType === "split_room_parent"', 'selectedObjectType === "bed_position"']).passed);
addCheck(checks, "inspector displays parent, divider, bed labels, and operational bed label", fileIncludes("apps/web/src/features/layout-editor/SplitRoomInspectorPanel.tsx", ["Parent room", "Divider orientation", "Divider ratio", "Bed labels", "Operational label"]).passed);
addCheck(checks, "advanced-only assignment target IDs are separated", fileIncludes("apps/web/src/features/layout-editor/SplitRoomInspectorPanel.tsx", ["advanced ?", "assignmentTargetIds"]).passed);
const status = statusFromChecks(checks);
if (status === "passed") updateHardeningManifest(issue, { splitRoomInspectorNormalFlowStatus: "passed", legacySplitBayQuickEditRemovedFromNormalFlow: true, splitRoomInspectorDrivesNormalEditing: true });
writeCloseout(issue, { title: "Replace Split-Bay Quick Edit with Split-Room Inspector in Normal Flow", reviewFinding: "Normal split-room editing uses SplitRoomInspectorPanel and no longer exposes legacy split-bay quick edit in the stage.", status, filesChanged: ["apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "apps/web/src/features/layout-editor/SplitRoomInspectorPanel.tsx", `docs/verification/issues/issue-${issue}/`], commands, evidence: [`docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`, `docs/verification/issues/issue-${issue}/screenshot-index.json`], limitations: ["Screenshot index is populated by issue 829 hard browser proof."] });
writeStageResult(issue, scriptName, stage, checks); if (status !== "passed") process.exit(1);
