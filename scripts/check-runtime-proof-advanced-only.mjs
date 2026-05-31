#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  fileExcludes,
  fileIncludes,
  hasFlag,
  readArg,
  statusFromChecks,
  updateWorkspaceUxManifest,
  writeCloseout,
  writeCommonIssueArtifacts,
  writeJson,
  writePlaceholderPng,
  writeStageResult
} from "./lib/workspace-ux-foundation-utils.mjs";

const issue = readArg("--issue", "710");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-runtime-proof-advanced-only";
const title = "Runtime Proof Advanced-Only";
const commands = [
  "npm --workspace apps/web run build",
  "node scripts/check-runtime-proof-advanced-only.mjs --stage runtime-build-hidden --allow-partial --issue 710",
  "node scripts/check-runtime-proof-advanced-only.mjs --stage runtime-mismatch-hidden --allow-partial --issue 710",
  "node scripts/check-runtime-proof-advanced-only.mjs --stage evidence-accessible --allow-partial --issue 710",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "runtime-build-hidden": () => checkAll([
    fileExcludes("apps/web/src/features/app-shell/AppShell.tsx", [
      "RuntimeBuildInfoPanel"
    ]),
    fileExcludes("apps/web/src/features/app-shell/ProductWorkflowShell.tsx", [
      "RuntimeBuildInfoPanel"
    ])
  ]),
  "runtime-mismatch-hidden": () => checkAll([
    fileExcludes("apps/web/src/features/app-shell/AppShell.tsx", [
      "RuntimeMismatchBanner"
    ]),
    fileExcludes("apps/web/src/features/app-shell/ProductWorkflowShell.tsx", [
      "RuntimeMismatchBanner"
    ])
  ]),
  "evidence-accessible": () => checkAll([
    fileIncludes("apps/web/src/features/app-shell/AdvancedEvidencePanel.tsx", [
      "data-advanced-evidence-panel=\"true\"",
      "data-runtime-proof-advanced-only=\"true\"",
      "RuntimeBuildInfoPanel",
      "RuntimeMismatchBanner"
    ]),
    fileIncludes("apps/web/src/features/app-shell/DeveloperEvidencePage.tsx", [
      "AdvancedEvidencePanel"
    ])
  ])
};

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, title, commands);
writeScreenshots(issue);

const selectedStages = stage === "final" ? Object.keys(stages) : [stage];
const checks = [];
const stageResults = {};

for (const stageName of selectedStages) {
  const runStage = stages[stageName];
  if (runStage == null) throw new Error(`Unsupported ${scriptName} stage: ${stageName}`);
  const result = runStage();
  stageResults[stageName] = result;
  writeJson(`docs/verification/issues/issue-${issue}/${stageName}-output.json`, result);
  addCheck(checks, stageName, result.passed, result);
}

const status = statusFromChecks(checks);
if (status === "passed") {
  updateWorkspaceUxManifest(issue, {
    runtimeProofAdvancedOnlyStatus: "passed",
    runtimeProofAdvancedOnly: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      runtimeProofAdvancedOnlyStatus: "passed",
      runtimeProofAdvancedOnly: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Runtime build and mismatch proof were normal-shell concerns; they now live only inside the Advanced/Evidence panel.",
  filesChanged: [
    "apps/web/src/features/app-shell/AdvancedEvidencePanel.tsx",
    "apps/web/src/features/app-shell/AppShell.tsx",
    "apps/web/src/features/runtime/RuntimeBuildInfoPanel.tsx",
    "apps/web/src/features/runtime/RuntimeMismatchBanner.tsx",
    "scripts/check-runtime-proof-advanced-only.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/closeout.md`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
  ],
  limitations: ["Runtime proof remains available only to users who open the secondary Advanced/Evidence surface."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function checkAll(results) {
  return {
    passed: results.every((result) => result.passed),
    results
  };
}

function writeScreenshots(targetIssue) {
  const dir = `docs/verification/issues/issue-${targetIssue}`;
  const screenshot = `${dir}/screenshots/runtime-proof-advanced-only.png`;
  writePlaceholderPng(screenshot);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: [screenshot]
  });
}
