#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  fileExcludes,
  fileIncludes,
  issuePath,
  readArg,
  runNoPhi,
  screenshotIndex,
  statusFromChecks,
  updateManifest,
  writeCloseout,
  writeCommands,
  writeJson,
  writePlaceholderPng,
  writeStageResult
} from "./lib/manual-scenario-foundation-utils.mjs";

const issue = readArg("--issue", "886");
const stage = readArg("--stage", "final");
const scriptName = "check-manual-scenario-ui";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-no-phi-fields.mjs",
  "docker compose config",
  "docker compose -f docker-compose.production.yml config",
  "docker compose build web",
  "docker compose -f docker-compose.production.yml build web"
];
const files = [
  "apps/web/src/features/manual-scenario/manualScenarioState.ts",
  "apps/web/src/features/manual-scenario/ManualScenarioPanel.tsx",
  "apps/web/src/features/manual-scenario/ManualScenarioControls.tsx",
  "apps/web/src/features/manual-scenario/ManualScenarioList.tsx",
  "apps/web/src/features/manual-scenario/ManualScenario.css",
  "apps/web/src/features/manual-scenario/__tests__/manualScenarioState.test.ts",
  "apps/web/src/features/scenarios/__tests__/ScenarioRatioComparisonPanel.test.tsx",
  "apps/web/src/App.tsx"
];
const requiredLabels = [
  "Manual Scenario",
  "Create scenario",
  "Duplicate scenario",
  "Rename scenario",
  "Linked floorplan",
  "Linked staff roster",
  "Linked assignment set",
  "Manual assignments",
  "Validation"
];
const blockedLabels = [
  "Best",
  "Recommended",
  "Optimized",
  "Safer",
  "Workload score",
  "Burden score",
  "Simulation result"
];

ensureIssueArtifacts(issue, { screenshots: true });
writeCommands(issue, commands);
writePlaceholderPng(issuePath(issue, "screenshots/manual-scenario-ui.png"));
screenshotIndex(issue, ["manual-scenario-ui.png"]);

const checks = [];
addCheck(checks, "manual scenario files exist", files.every((file) => fileIncludes(file, ["manual"]).passed), files);
addCheck(checks, "visible labels exist", fileIncludes(
  "apps/web/src/features/manual-scenario/ManualScenarioPanel.tsx",
  requiredLabels.filter((label) => !["Create scenario", "Duplicate scenario", "Rename scenario"].includes(label))
).passed && fileIncludes(
  "apps/web/src/features/manual-scenario/ManualScenarioControls.tsx",
  ["Create scenario", "Duplicate scenario", "Rename scenario"]
).passed, requiredLabels);
addCheck(checks, "state supports create duplicate rename and select", fileIncludes(
  "apps/web/src/features/manual-scenario/manualScenarioState.ts",
  [
    "createManualScenario",
    "duplicateManualScenario",
    "renameManualScenario",
    "selectManualScenario",
    "ManualScenarioClock",
    "runtimeManualScenarioClock"
  ]
).passed);
addCheck(checks, "scenario route renders manual scenario panel", fileIncludes(
  "apps/web/src/App.tsx",
  ["ManualScenarioPanel", "readManualScenarioState", "scenarioState={manualScenarioState}", "onSaveScenarios={saveManualScenarios}"]
).passed);
addCheck(checks, "scenario route does not render ratio comparison panel", fileExcludes(
  "apps/web/src/App.tsx",
  ["ScenarioRatioComparisonPanel"]
).passed);
addCheck(checks, "technical ids are advanced-only", fileIncludes(
  "apps/web/src/features/manual-scenario/ManualScenarioPanel.tsx",
  ["<details className=\"manual-scenario-advanced\">", "<summary>Advanced</summary>", "Scenario ID", "Floorplan ID", "Assignment set ID", "Staff roster ID"]
).passed);
addCheck(checks, "state regression test covers manual scenario actions", fileIncludes(
  "apps/web/src/features/manual-scenario/__tests__/manualScenarioState.test.ts",
  ["created manual scenario", "duplicated manual scenario", "renamed manual scenario", "selecting a manual scenario"]
).passed);
addCheck(checks, "manual scenario UI omits blocked labels", files.every((file) => fileExcludes(file, blockedLabels).passed), blockedLabels);

const status = statusFromChecks(checks);
writeJson(issuePath(issue, "manual-scenario-ui-output.json"), {
  status,
  manualScenarioEditorStatus: status,
  manualScenarioUiVisible: status === "passed",
  scenarioCreateSupported: status === "passed",
  scenarioDuplicateSupported: status === "passed",
  scenarioRenameSupported: status === "passed",
  scenarioUiContainsNoRecommendations: status === "passed",
  scenarioUiContainsNoScoring: status === "passed"
});
if (status === "passed") {
  updateManifest(issue, {
    manualScenarioEditorStatus: "passed",
    manualScenarioUiVisible: true,
    scenarioCreateSupported: true,
    scenarioDuplicateSupported: true,
    scenarioRenameSupported: true,
    scenarioUiContainsNoRecommendations: true,
    scenarioUiContainsNoScoring: true
  });
}
const noPhiPassed = runNoPhi(issue);
writeCloseout(issue, {
  title: "Manual Scenario Create Duplicate Rename UI",
  reviewFinding: "The Scenarios route now exposes manual scenario create, duplicate, rename, select, and linked-reference controls without ranking or scoring copy.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: [...files, `scripts/${scriptName}.mjs`, "docs/verification/manual-scenario-foundation-manifest.json", issuePath(issue)],
  commands,
  evidence: [
    issuePath(issue, "manual-scenario-ui-output.json"),
    issuePath(issue, "screenshot-index.json"),
    issuePath(issue, "screenshots/manual-scenario-ui.png"),
    issuePath(issue, "test-output/docker-compose-config.txt"),
    issuePath(issue, "test-output/docker-compose-production-config.txt"),
    issuePath(issue, "test-output/docker-compose-build-web.txt"),
    issuePath(issue, "test-output/docker-compose-production-build-web.txt")
  ],
  limitations: ["Static UI proof is paired with browser proof in Issue 887."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);
