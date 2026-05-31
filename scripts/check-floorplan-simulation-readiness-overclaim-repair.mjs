#!/usr/bin/env node
import {
  addCheck,
  checkAll,
  ensureIssueDirs,
  fileExcludes,
  fileIncludes,
  hasFlag,
  readArg,
  statusFromChecks,
  updateRepairManifest,
  writeCloseout,
  writeCommonIssueArtifacts,
  writeJson,
  writeStageResult
} from "./lib/workspace-ux-repair-utils.mjs";

const issue = readArg("--issue", "754");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-floorplan-simulation-readiness-overclaim-repair";
const title = "Remove Floorplan-Only Simulation Readiness";
const commands = [
  "node scripts/check-floorplan-simulation-readiness-overclaim-repair.mjs --stage no-active-for-simulation-item --issue 754",
  "node scripts/check-floorplan-simulation-readiness-overclaim-repair.mjs --stage no-floorplan-only-ready-for-simulation --issue 754",
  "node scripts/check-milestone-a-no-overclaim.mjs --stage no-simulation-overclaim --issue 754"
];

const stages = {
  "no-active-for-simulation-item": () => checkAll([
    fileExcludes("packages/shared/src/floorplans/floorplanReadinessContract.ts", ["active_for_simulation"]),
    fileExcludes("apps/web/src/features/floorplans/floorplanReadinessViewModel.ts", ["active_for_simulation"])
  ]),
  "no-floorplan-only-ready-for-simulation": () => checkAll([
    fileIncludes("packages/shared/src/floorplans/floorplanReadinessContract.ts", ["simulationStatus: \"blocked_until_assignment_contract\";"]),
    fileIncludes("apps/web/src/features/floorplans/floorplanReadinessViewModel.ts", ["simulationStatus: \"blocked_until_assignment_contract\""]),
    fileExcludes("apps/web/src/features/floorplans/floorplanReadinessViewModel.ts", ["ready_for_simulation"])
  ])
};
stages.final = () => checkAll([stages["no-active-for-simulation-item"](), stages["no-floorplan-only-ready-for-simulation"]()]);

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, title, commands);
const selectedStages = stage === "final" ? ["no-active-for-simulation-item", "no-floorplan-only-ready-for-simulation"] : [stage];
const checks = [];
const stageResults = {};
for (const stageName of selectedStages) {
  const result = stages[stageName]?.();
  if (result == null) throw new Error(`Unsupported ${scriptName} stage: ${stageName}`);
  stageResults[stageName] = result;
  writeJson(`docs/verification/issues/issue-${issue}/${stageName}-output.json`, result);
  addCheck(checks, stageName, result.passed, result);
}
const status = statusFromChecks(checks);
const patch = {
  floorplanSimulationOverclaimRepairStatus: "passed",
  activeForSimulationRemovedFromFloorplanReadiness: true,
  floorplanOnlyCannotBeSimulationReady: true
};
if (status === "passed") updateRepairManifest(issue, patch);
else writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, { status, issue: String(issue), skippedPatch: patch });
writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Floorplan readiness could claim simulation readiness from a floorplan-only state; the repair limits the contract to assignment readiness and blocks later readiness until later contracts exist.",
  filesChanged: [
    "packages/shared/src/floorplans/floorplanReadinessContract.ts",
    "apps/web/src/features/floorplans/floorplanReadinessViewModel.ts",
    "apps/web/src/features/floorplans/FloorplanReadinessChecklist.tsx",
    "scripts/check-floorplan-simulation-readiness-overclaim-repair.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [`docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`],
  limitations: ["Scenario and simulation readiness remain intentionally blocked for later milestones."]
});
writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);
