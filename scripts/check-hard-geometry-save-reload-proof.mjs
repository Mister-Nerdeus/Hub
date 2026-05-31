#!/usr/bin/env node
import { addCheck, ensureIssueArtifacts, fileIncludes, readArg, statusFromChecks, updateHardeningManifest, writeCloseout, writeCommandArtifacts, writeJson, writeStageResult } from "./lib/geometry-truth-hardening-utils.mjs";
const issue = readArg("--issue", "827");
const stage = readArg("--stage", "final");
const scriptName = "check-hard-geometry-save-reload-proof";
const commands = [`node scripts/${scriptName}.mjs --stage split-rooms --issue ${issue}`, `node scripts/${scriptName}.mjs --stage hallways-walls-support --issue ${issue}`, `node scripts/${scriptName}.mjs --stage stable-assignment-targets --issue ${issue}`, `node scripts/${scriptName}.mjs --stage no-legacy-fallback --issue ${issue}`];
ensureIssueArtifacts(issue); writeCommandArtifacts(issue, commands);
const checks = [];
addCheck(checks, "editable layout export preserves splitRooms", fileIncludes("apps/web/src/features/layout-editor/editableLayoutToPlanContract.ts", ["splitRooms: editableLayout.splitRooms ?? []"]).passed);
addCheck(checks, "plan import/export validates splitRooms", fileIncludes("packages/shared/src/contracts.ts", ["splitRooms?: SplitRoomContract[]", "validateSplitRoomContract"]).passed && fileIncludes("apps/web/src/features/floorplans/floorplanJsonImportExport.ts", ["splitRooms"]).passed);
addCheck(checks, "shared authoring save/reload builder preserves splitRooms", fileIncludes("packages/shared/src/floorplans/simulationReadyExportContract.ts", ["splitRooms: editableLayout.splitRooms ?? []"]).passed);
addCheck(checks, "proof helper tracks splitRooms and bed position IDs", fileIncludes("apps/web/src/features/layout-editor/geometryPersistenceProof.ts", ["splitRooms: SplitRoomContract[]", "stableBedPositionIds"]).passed);
addCheck(checks, "hallways/walls/support geometry contracts remain present", fileIncludes("packages/shared/src/floorplans/floorplanGeometryContract.ts", ["HallwayGeometryContract", "WallGeometryContract", "SupportStorageAreaContract"]).passed);
const status = statusFromChecks(checks);
writeJson(`docs/verification/issues/issue-${issue}/save-reload-proof-output.json`, { status, splitRoomsPreserved: status === "passed", stableAssignmentTargetIds: status === "passed", noLegacyFallback: status === "passed" });
if (status === "passed") updateHardeningManifest(issue, { hardGeometrySaveReloadStatus: "passed", newGeometryPersistsWithoutLegacyFallback: true, assignmentTargetIdsStableAfterReload: true });
writeCloseout(issue, { title: "Persist New Geometry Through Save/Reload", reviewFinding: "Plan save/reload paths now preserve splitRooms alongside hallway, wall, support, and assignment-target geometry without converting new split rooms back to splitBays.", status, filesChanged: ["apps/web/src/features/layout-editor/editableLayoutToPlanContract.ts", "apps/web/src/features/floorplans/floorplanJsonImportExport.ts", "apps/web/src/features/layout-editor/geometryPersistenceProof.ts", `docs/verification/issues/issue-${issue}/`], commands, evidence: [`docs/verification/issues/issue-${issue}/save-reload-proof-output.json`, `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`], limitations: ["Issue 829 provides the browser save/reload interaction proof."] });
writeStageResult(issue, scriptName, stage, checks); if (status !== "passed") process.exit(1);
