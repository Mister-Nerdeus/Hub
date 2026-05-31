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
  writeStageResult
} from "./lib/workspace-ux-foundation-utils.mjs";

const issue = readArg("--issue", "711");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-future-tools-hidden-normal-mode";
const title = "Hide Future Tools from Normal Mode";
const commands = [
  "node scripts/check-future-tools-hidden-normal-mode.mjs --stage future-tools-hidden --allow-partial --issue 711",
  "node scripts/check-future-tools-hidden-normal-mode.mjs --stage advanced-evidence-only --allow-partial --issue 711",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "future-tools-hidden": () => checkAll([
    fileIncludes("apps/web/src/features/app-shell/appNavigation.ts", [
      "export const FUTURE_APP_SECTIONS: readonly AppSection[] = []"
    ]),
    fileExcludes("apps/web/src/features/app-shell/ProductWorkflowShell.tsx", [
      "Future Tools"
    ]),
    fileExcludes("apps/web/src/features/app-shell/ProductSidebarRail.tsx", [
      "Future Tools"
    ])
  ]),
  "advanced-evidence-only": () => checkAll([
    fileIncludes("apps/web/src/features/app-shell/appNavigation.ts", [
      "id: \"developer-evidence\", label: \"Advanced/Evidence\", group: \"advanced\""
    ]),
    fileIncludes("apps/web/src/features/app-shell/ProductSidebarRail.tsx", [
      "data-advanced-evidence-secondary=\"true\""
    ])
  ])
};

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, title, commands);

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
    futureToolsHiddenNormalModeStatus: "passed",
    futureToolsHiddenNormalMode: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      futureToolsHiddenNormalModeStatus: "passed",
      futureToolsHiddenNormalMode: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Future Tools was a top-level proof/workbench navigation concept; normal navigation now has no Future Tools group and keeps Advanced/Evidence secondary.",
  filesChanged: [
    "apps/web/src/features/app-shell/AppShell.tsx",
    "apps/web/src/features/app-shell/appNavigation.ts",
    "scripts/check-future-tools-hidden-normal-mode.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/closeout.md`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
  ],
  limitations: ["Advanced routes remain reachable from the secondary rail disclosure; they are not normal workflow steps."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function checkAll(results) {
  return {
    passed: results.every((result) => result.passed),
    results
  };
}
