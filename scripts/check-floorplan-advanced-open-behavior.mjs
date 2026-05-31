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

const issue = readArg("--issue", "753");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-floorplan-advanced-open-behavior";
const title = "Floorplan Advanced Panel Open Behavior";
const commands = [
  "node scripts/check-floorplan-advanced-open-behavior.mjs --stage button-opens-panel --issue 753",
  "node scripts/check-floorplan-advanced-open-behavior.mjs --stage focus-accessible --issue 753"
];

const stages = {
  "button-opens-panel": () => checkAll([
    fileIncludes("apps/web/src/features/floorplans/ActiveFloorplanHub.tsx", [
      "const [advancedOpen, setAdvancedOpen] = useState(false);",
      "open={advancedOpen}",
      "setAdvancedOpen(true)"
    ]),
    fileExcludes("apps/web/src/features/floorplans/ActiveFloorplanHub.tsx", ["scrollIntoView()}"])
  ]),
  "focus-accessible": () => checkAll([
    fileIncludes("apps/web/src/features/floorplans/ActiveFloorplanHub.tsx", [
      "advancedPanelRef.current?.focus();",
      "tabIndex={-1}",
      "onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}"
    ]),
    fileIncludes("apps/web/src/features/floorplans/ActiveFloorplanCard.tsx", ["aria-controls=\"floorplan-advanced-panel\""])
  ])
};

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, title, commands);
const selectedStages = stage === "final" ? Object.keys(stages) : [stage];
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
const patch = { floorplanAdvancedOpenBehaviorStatus: "passed", advancedButtonOpensDetails: true };
if (status === "passed") updateRepairManifest(issue, patch);
else writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, { status, issue: String(issue), skippedPatch: patch });
writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The Advanced button only scrolled to a collapsed region; the repair makes the details element controlled and moves focus after opening.",
  filesChanged: [
    "apps/web/src/features/floorplans/ActiveFloorplanHub.tsx",
    "apps/web/src/features/floorplans/ActiveFloorplanCard.tsx",
    "scripts/check-floorplan-advanced-open-behavior.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [`docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`],
  limitations: ["The behavior is local UI state only; no durable assignment work is introduced."]
});
writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);
