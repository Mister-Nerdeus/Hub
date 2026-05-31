#!/usr/bin/env node
import { addCheck, ensureIssueArtifacts, fileExcludes, fileIncludes, readArg, statusFromChecks, updateHardeningManifest, writeCloseout, writeCommandArtifacts, writeJson, writeStageResult } from "./lib/geometry-truth-hardening-utils.mjs";
const issue = readArg("--issue", "821");
const stage = readArg("--stage", "final");
const scriptName = "check-split-room-render-path";
const commands = [`node scripts/${scriptName}.mjs --stage split-room-shape-used --issue ${issue}`, `node scripts/${scriptName}.mjs --stage split-bay-shape-not-normal-path --issue ${issue}`, `node scripts/${scriptName}.mjs --stage bed-position-shape-used --issue ${issue}`, `node scripts/${scriptName}.mjs --stage data-object-types-correct --issue ${issue}`];
ensureIssueArtifacts(issue, { screenshots: true }); writeCommandArtifacts(issue, commands);
writeJson(`docs/verification/issues/issue-${issue}/screenshot-index.json`, { status: "pending-hard-browser-proof", screenshots: [] });
const checks = [];
addCheck(checks, "normal editor imports and renders SplitRoomShape", fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", ["import { SplitRoomShape", "splitRoomItems.map", "<SplitRoomShape"]).passed);
addCheck(checks, "normal editor does not import/render SplitBayShape", fileExcludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", ["SplitBayShape", "buildSplitBayShapeViewModel"]).passed);
addCheck(checks, "SplitRoomShape renders BedPositionShape", fileIncludes("apps/web/src/features/layout-editor/SplitRoomShape.tsx", ["BedPositionShape", 'data-layout-object-type="split_room_parent"']).passed);
addCheck(checks, "BedPositionShape exposes bed_position object type", fileIncludes("apps/web/src/features/layout-editor/BedPositionShape.tsx", ['data-layout-object-type="bed_position"', 'data-assignment-target']).passed);
const status = statusFromChecks(checks);
if (status === "passed") updateHardeningManifest(issue, { splitRoomRenderPathStatus: "passed", normalEditorUsesSplitRoomShape: true, legacySplitBayShapeRemovedFromNormalPath: true });
writeCloseout(issue, { title: "Replace SplitBay Render Path with SplitRoom Render Path", reviewFinding: "The main editor render path now renders SplitRoomShape and nested BedPositionShape instead of SplitBayShape.", status, filesChanged: ["apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "apps/web/src/features/layout-editor/SplitRoomShape.tsx", "apps/web/src/features/layout-editor/BedPositionShape.tsx", `docs/verification/issues/issue-${issue}/`], commands, evidence: [`docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`, `docs/verification/issues/issue-${issue}/screenshot-index.json`], limitations: ["Screenshot index is populated by issue 829 hard browser proof."] });
writeStageResult(issue, scriptName, stage, checks); if (status !== "passed") process.exit(1);
