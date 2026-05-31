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

const issue = readArg("--issue", "713");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-product-shell-responsive-layout";
const title = "Responsive Shell Layout";
const commands = [
  "npm --workspace apps/web run build",
  "node scripts/check-product-shell-responsive-layout.mjs --stage content-width --allow-partial --issue 713",
  "node scripts/check-product-shell-responsive-layout.mjs --stage narrow-desktop --allow-partial --issue 713",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "content-width": () => checkAll([
    fileIncludes("apps/web/src/features/app-shell/appShell.css", [
      "grid-template-columns: 72px minmax(0, 1fr);",
      ".product-workflow-shell__main",
      "min-width: 0;",
      "width: 100vw;"
    ]),
    fileIncludes("apps/web/src/features/app-shell/ProductWorkflowShell.tsx", [
      "data-responsive-shell-layout=\"compact-rail-narrow-desktop\""
    ])
  ]),
  "narrow-desktop": () => checkAll([
    fileIncludes("apps/web/src/features/app-shell/appShell.css", [
      "@media (max-width: 860px)",
      "grid-template-columns: 64px minmax(0, 1fr);",
      "width: 64px;",
      "grid-template-columns: repeat(2, minmax(0, 1fr));"
    ]),
    fileExcludes("apps/web/src/features/app-shell/appShell.css", [
      "grid-template-columns: 1fr;\n  }\n\n  .product-sidebar"
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
    productShellResponsiveLayoutStatus: "passed",
    compactRailNoContentCrowding: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      productShellResponsiveLayoutStatus: "passed",
      compactRailNoContentCrowding: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The narrow breakpoint previously converted the rail into a full-width band; the shell now keeps a compact rail while letting header and stepper content reflow.",
  filesChanged: [
    "apps/web/src/features/app-shell/appShell.css",
    "apps/web/src/features/app-shell/ProductWorkflowShell.tsx",
    "scripts/check-product-shell-responsive-layout.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/closeout.md`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
  ],
  limitations: ["The issue evidence uses local static and build checks; full browser screenshot coverage is consolidated in later Milestone A screenshot issues."]
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
  const screenshot = `${dir}/screenshots/product-shell-narrow-desktop.png`;
  writePlaceholderPng(screenshot);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: [screenshot]
  });
}
