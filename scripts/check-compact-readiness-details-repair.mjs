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

const issue = readArg("--issue", "755");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-compact-readiness-details-repair";
const title = "Compact Readiness Details Repair";
const commands = [
  "node scripts/check-compact-readiness-details-repair.mjs --stage dense-details-layout --issue 755",
  "node scripts/check-compact-readiness-details-repair.mjs --stage needs-work-first --issue 755",
  "node scripts/check-compact-readiness-details-repair.mjs --stage no-giant-readiness-cards --issue 755"
];

const stages = {
  "dense-details-layout": () => checkAll([
    fileIncludes("apps/web/src/features/floorplans/FloorplanReadinessChecklist.tsx", ["data-readiness-details-layout=\"dense-list\""]),
    fileIncludes("apps/web/src/styles.css", [
      "grid-template-columns: 82px minmax(0, 0.9fr) minmax(160px, 1.2fr);",
      "padding: 6px 8px;"
    ])
  ]),
  "needs-work-first": () => checkAll([
    fileIncludes("apps/web/src/features/floorplans/FloorplanReadinessChecklist.tsx", [
      ".sort(sortReadinessItems)",
      "left.status === \"needs_work\" ? -1 : 1"
    ])
  ]),
  "no-giant-readiness-cards": () => checkAll([
    fileIncludes("apps/web/src/styles.css", [".floorplan-readiness-checklist li span"]),
    fileExcludes("apps/web/src/features/floorplans/FloorplanReadinessChecklist.tsx", [">Ready<"])
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
const patch = { compactReadinessDetailsRepairStatus: "passed", readinessDetailsDense: true, readinessDetailsNoGiantCards: true };
if (status === "passed") updateRepairManifest(issue, patch);
else writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, { status, issue: String(issue), skippedPatch: patch });
writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Expanded readiness rendered as large repeated rows; the repair sorts needs-work items first and uses a dense three-column checklist.",
  filesChanged: [
    "apps/web/src/features/floorplans/FloorplanReadinessChecklist.tsx",
    "apps/web/src/styles.css",
    "scripts/check-compact-readiness-details-repair.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [`docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`],
  limitations: ["Screenshot proof for expanded readiness is captured by Issue 757."]
});
writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);
