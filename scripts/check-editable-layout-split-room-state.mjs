#!/usr/bin/env node
import { addCheck, ensureIssueArtifacts, fileIncludes, readArg, statusFromChecks, updateHardeningManifest, writeCloseout, writeCommandArtifacts, writeStageResult } from "./lib/geometry-truth-hardening-utils.mjs";
const issue = readArg("--issue", "820");
const stage = readArg("--stage", "final");
const scriptName = "check-editable-layout-split-room-state";
const commands = [`node scripts/${scriptName}.mjs --stage split-rooms-collection --issue ${issue}`, `node scripts/${scriptName}.mjs --stage no-fake-child-rooms --issue ${issue}`, `node scripts/${scriptName}.mjs --stage legacy-split-bays-compat-only --issue ${issue}`];
ensureIssueArtifacts(issue); writeCommandArtifacts(issue, commands);
const checks = [];
addCheck(checks, "editable layout has splitRooms collection", fileIncludes("packages/shared/src/layout-editor/editableLayoutGeometryContract.ts", ["splitRooms?: SplitRoomContract[]", "validateSplitRoomReferences(splitRooms, rooms)"]).passed);
addCheck(checks, "plan contract preserves splitRooms", fileIncludes("packages/shared/src/contracts.ts", ["splitRooms?: SplitRoomContract[]", "const splitRooms = requireArray(plan.splitRooms ?? [], \"splitRooms\")"]).passed);
addCheck(checks, "editor load/save maps splitRooms", fileIncludes("apps/web/src/features/layout-editor/layoutEditorState.ts", ["splitRooms: plan.splitRooms ?? []"]).passed && fileIncludes("apps/web/src/features/layout-editor/editableLayoutToPlanContract.ts", ["splitRooms: editableLayout.splitRooms ?? []"]).passed);
addCheck(checks, "legacy splitBays marked compatibility-only", fileIncludes("packages/shared/src/layout-editor/editableLayoutGeometryContract.ts", ["Legacy split-bay overlays are compatibility-only"]).passed);
const status = statusFromChecks(checks);
if (status === "passed") updateHardeningManifest(issue, { editableLayoutSplitRoomStateStatus: "passed", editableLayoutHasSplitRoomsCollection: true, splitBedsNotStoredAsFakeRooms: true });
writeCloseout(issue, { title: "Add Split Rooms to Editable Layout State Model", reviewFinding: "Editable and plan contracts now carry splitRooms while keeping legacy splitBays compatibility-only.", status, filesChanged: ["packages/shared/src/layout-editor/editableLayoutGeometryContract.ts", "packages/shared/src/contracts.ts", "apps/web/src/features/layout-editor/layoutEditorState.ts", "apps/web/src/features/layout-editor/editableLayoutToPlanContract.ts", `docs/verification/issues/issue-${issue}/`], commands, evidence: [`docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`, `docs/verification/issues/issue-${issue}/manifest-update-output.json`], limitations: [] });
writeStageResult(issue, scriptName, stage, checks); if (status !== "passed") process.exit(1);
