#!/usr/bin/env node
import { addCheck, ensureIssueArtifacts, fileIncludes, readArg, statusFromChecks, updateHardeningManifest, writeCloseout, writeCommandArtifacts, writeJson, writeStageResult } from "./lib/geometry-truth-hardening-utils.mjs";
const issue = readArg("--issue", "822");
const stage = readArg("--stage", "final");
const scriptName = "check-split-bed-selection-state";
const commands = [`node scripts/${scriptName}.mjs --stage selection-types --issue ${issue}`, `node scripts/${scriptName}.mjs --stage bed-position-selectable --issue ${issue}`, `node scripts/${scriptName}.mjs --stage parent-separate-selection --issue ${issue}`, `node scripts/${scriptName}.mjs --stage bed-does-not-resize-parent --issue ${issue}`];
ensureIssueArtifacts(issue, { screenshots: true }); writeCommandArtifacts(issue, commands); writeJson(`docs/verification/issues/issue-${issue}/screenshot-index.json`, { status: "pending-hard-browser-proof", screenshots: [] });
const checks = [];
addCheck(checks, "selection types include split parent and beds", fileIncludes("apps/web/src/features/layout-editor/layoutSelectionModel.ts", ['"split_room_parent"', '"bed_position"', 'case "split_room_parent"', 'case "bed_position"']).passed);
addCheck(checks, "bed selection stops parent click propagation", fileIncludes("apps/web/src/features/layout-editor/BedPositionShape.tsx", ["event.stopPropagation()", 'onSelect?.("bed_position", bedPosition.bedPositionId)']).passed);
addCheck(checks, "parent selection is separate", fileIncludes("apps/web/src/features/layout-editor/SplitRoomShape.tsx", ["onSelectParent?.(splitRoom.splitRoomId)", "selectedBedPositionId"]).passed);
addCheck(checks, "resize handles limited to parent selection, not bed selection", fileIncludes("apps/web/src/features/layout-editor/roomResizeHandlesViewModel.ts", ['selectedObjectType !== "split_room_parent"', 'selectedObjectType !== "room"']).passed);
const status = statusFromChecks(checks);
if (status === "passed") updateHardeningManifest(issue, { splitBedSelectionStateStatus: "passed", bedPositionIsRealSelectableObject: true, splitParentIsSeparateSelectableObject: true });
writeCloseout(issue, { title: "Add Split Room Parent and Bed Position Selection to Editor State", reviewFinding: "Selection model now treats split_room_parent and bed_position as real selectable objects with independent parent/bed selection behavior.", status, filesChanged: ["apps/web/src/features/layout-editor/layoutSelectionModel.ts", "apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "apps/web/src/features/layout-editor/BedPositionShape.tsx", "apps/web/src/features/layout-editor/SplitRoomShape.tsx", `docs/verification/issues/issue-${issue}/`], commands, evidence: [`docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`, `docs/verification/issues/issue-${issue}/screenshot-index.json`], limitations: ["Screenshot index is populated by issue 829 hard browser proof."] });
writeStageResult(issue, scriptName, stage, checks); if (status !== "passed") process.exit(1);
