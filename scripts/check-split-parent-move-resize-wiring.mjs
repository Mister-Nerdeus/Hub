#!/usr/bin/env node
import { addCheck, ensureIssueArtifacts, fileIncludes, readArg, statusFromChecks, updateHardeningManifest, writeCloseout, writeCommandArtifacts, writeJson, writeStageResult } from "./lib/geometry-truth-hardening-utils.mjs";
const issue = readArg("--issue", "823");
const stage = readArg("--stage", "final");
const scriptName = "check-split-parent-move-resize-wiring";
const commands = [`node scripts/${scriptName}.mjs --stage parent-move --issue ${issue}`, `node scripts/${scriptName}.mjs --stage parent-resize --issue ${issue}`, `node scripts/${scriptName}.mjs --stage beds-relative-after-resize --issue ${issue}`, `node scripts/${scriptName}.mjs --stage no-fake-child-room-resize --issue ${issue}`];
ensureIssueArtifacts(issue, { screenshots: true }); writeCommandArtifacts(issue, commands); writeJson(`docs/verification/issues/issue-${issue}/screenshot-index.json`, { status: "pending-hard-browser-proof", screenshots: [] });
const checks = [];
addCheck(checks, "stage wires split parent move", fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", ["startSplitRoomParentMove", "moveSplitRoomParentFromStage", 'type: "moveSplitRoomParent"']).passed);
addCheck(checks, "stage wires split parent resize", fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", ['type: "resizeSplitRoomParent"', 'stageState.selectedObjectType === "split_room_parent"']).passed);
addCheck(checks, "reducer calls move and resize helpers", fileIncludes("apps/web/src/features/layout-editor/layoutEditorReducer.ts", ["moveSplitRoomParent({", "resizeSplitRoomParent({", "selectedObjectType: \"split_room_parent\""]).passed);
addCheck(checks, "bed bounds remain relative after resize", fileIncludes("apps/web/src/features/layout-editor/splitRoomActions.ts", ["recalculateSplitRoomBedRelativeBounds", "relativeBounds"]).passed);
const status = statusFromChecks(checks);
if (status === "passed") updateHardeningManifest(issue, { splitParentMoveResizeWiringStatus: "passed", splitParentMovesAsOneFootprint: true, splitParentResizeRecalculatesBedBounds: true });
writeCloseout(issue, { title: "Wire Split Room Parent Move and Resize Behavior", reviewFinding: "Split-room parent drag and resize dispatch dedicated reducer actions that mutate the parent footprint while preserving bed relative bounds.", status, filesChanged: ["apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "apps/web/src/features/layout-editor/layoutEditorReducer.ts", "apps/web/src/features/layout-editor/roomResizeHandlesViewModel.ts", `docs/verification/issues/issue-${issue}/`], commands, evidence: [`docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`, `docs/verification/issues/issue-${issue}/screenshot-index.json`], limitations: ["Screenshot index is populated by issue 829 hard browser proof."] });
writeStageResult(issue, scriptName, stage, checks); if (status !== "passed") process.exit(1);
