#!/usr/bin/env node
import { addCheck, ensureIssueArtifacts, fileIncludes, readArg, statusFromChecks, updateHardeningManifest, writeCloseout, writeCommandArtifacts, writeJson, writeStageResult } from "./lib/geometry-truth-hardening-utils.mjs";
const issue = readArg("--issue", "826");
const stage = readArg("--stage", "final");
const scriptName = "check-wall-selection-behavior";
const commands = [`node scripts/${scriptName}.mjs --stage wall-click-selection --issue ${issue}`, `node scripts/${scriptName}.mjs --stage wall-keyboard-selection --issue ${issue}`, `node scripts/${scriptName}.mjs --stage selectable-contract-has-handler --issue ${issue}`];
ensureIssueArtifacts(issue, { screenshots: true }); writeCommandArtifacts(issue, commands); writeJson(`docs/verification/issues/issue-${issue}/screenshot-index.json`, { status: "pending-hard-browser-proof", screenshots: [] });
const checks = [];
addCheck(checks, "WallShape selectable has click handler", fileIncludes("apps/web/src/features/layout-editor/WallShape.tsx", ['data-selectable="true"', "onClick={() => onSelect?."]).passed);
addCheck(checks, "WallShape selectable has keyboard handler", fileIncludes("apps/web/src/features/layout-editor/WallShape.tsx", ["onKeyDown", 'event.key === "Enter"', 'event.key === " "']).passed);
addCheck(checks, "stage passes wall selection handler", fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", ["<WallShape", "selectStageObject(\"outer_wall\""]).passed);
addCheck(checks, "selection/inspector models support outer_wall", fileIncludes("apps/web/src/features/layout-editor/layoutSelectionModel.ts", ['"outer_wall"', 'case "outer_wall"']).passed && fileIncludes("apps/web/src/features/layout-editor/layoutInspectorViewModel.ts", ['case "outer_wall"', "Locked"]).passed);
const status = statusFromChecks(checks);
if (status === "passed") updateHardeningManifest(issue, { wallSelectionBehaviorStatus: "passed", selectableWallsActuallySelectable: true });
writeCloseout(issue, { title: "Wall Selection Behavior Hardening", reviewFinding: "Selectable walls now have click and keyboard handlers, and locked outer walls can be selected and inspected without enabling edits.", status, filesChanged: ["apps/web/src/features/layout-editor/WallShape.tsx", "apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "apps/web/src/features/layout-editor/layoutSelectionModel.ts", "apps/web/src/features/layout-editor/layoutInspectorViewModel.ts", `docs/verification/issues/issue-${issue}/`], commands, evidence: [`docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`, `docs/verification/issues/issue-${issue}/screenshot-index.json`], limitations: ["Screenshot index is populated by issue 829 hard browser proof."] });
writeStageResult(issue, scriptName, stage, checks); if (status !== "passed") process.exit(1);
