#!/usr/bin/env node
import {
  addCheck,
  checkAll,
  ensureIssueDirs,
  fileIncludes,
  hasFlag,
  readArg,
  readText,
  statusFromChecks,
  updateRepairManifest,
  workspaceUxRepairRequiredManifestFlags,
  workspaceUxRepairRootScripts,
  writeCloseout,
  writeCommonIssueArtifacts,
  writeJson,
  writeStageResult,
  writeText
} from "./lib/workspace-ux-repair-utils.mjs";

const issue = readArg("--issue", "749");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-workspace-ux-repair-preflight";
const title = "Workspace UX Repair Preflight";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-workspace-ux-repair-preflight.mjs --stage manifest-contract --issue 749",
  "node scripts/check-workspace-ux-repair-preflight.mjs --stage failure-reproduction --issue 749",
  "node scripts/check-workspace-ux-repair-preflight.mjs --stage scope-boundary --issue 749",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "manifest-contract": checkManifestContract,
  "failure-reproduction": checkFailureReproduction,
  "scope-boundary": checkScopeBoundary,
  "root-script-wiring": checkRootScriptWiring
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
  updateRepairManifest(issue, {
    workspaceUxRepairPreflightStatus: "passed",
    workspaceUxRepairGoNoGoStatus: "not_ready",
    durableAssignmentFoundationStatus: "not_started"
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      workspaceUxRepairPreflightStatus: "passed",
      workspaceUxRepairGoNoGoStatus: "not_ready",
      durableAssignmentFoundationStatus: "not_started"
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Milestone A closeout artifacts were present, but source and screenshot evidence still allowed visible layout failures and floorplan-only simulation readiness claims.",
  filesChanged: [
    "docs/verification/workspace-ux-repair-manifest.json",
    "docs/project/workspace-ux-foundation-status.md",
    "scripts/check-workspace-ux-repair-preflight.mjs",
    "scripts/check-workspace-ux-repair-go-no-go.mjs",
    "scripts/lib/workspace-ux-repair-utils.mjs",
    "package.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/first-failure.txt`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`,
    "docs/verification/workspace-ux-repair-manifest.json"
  ],
  limitations: ["Issue 749 intentionally leaves durable assignment foundation blocked until Issue 764 passes."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function checkManifestContract() {
  return checkAll([
    fileIncludes("docs/verification/workspace-ux-repair-manifest.json", [
      ...Object.keys(workspaceUxRepairRequiredManifestFlags).map((key) => `"${key}":`),
      "\"durableAssignmentFoundationStatus\": \"not_started\""
    ])
  ]);
}

function checkFailureReproduction() {
  const firstFailurePath = `docs/verification/issues/issue-${issue}/first-failure.txt`;
  const requiredFindings = [
    "Floorplan card title wraps vertically.",
    "Horizontal scrollbar appears in normal mode.",
    "Readiness details are too large.",
    "Floorplan-only state still references simulation readiness.",
    "Editor bottom details expose technical labels."
  ];
  const existing = readText(firstFailurePath);
  if (requiredFindings.every((finding) => existing.includes(finding))) {
    return { passed: true, mode: "recorded-first-failure", findings: requiredFindings };
  }

  const sourceFindings = [
    {
      finding: requiredFindings[0],
      passed: readText("apps/web/src/styles.css").includes("overflow-wrap: anywhere;")
    },
    {
      finding: requiredFindings[1],
      passed: readText("apps/web/src/features/app-shell/appShell.css").includes("width: 100vw;")
    },
    {
      finding: requiredFindings[2],
      passed: readText("apps/web/src/features/floorplans/FloorplanReadinessChecklist.tsx").includes("<ul>")
    },
    {
      finding: requiredFindings[3],
      passed: readText("apps/web/src/features/floorplans/floorplanReadinessViewModel.ts").includes("active_for_simulation")
    },
    {
      finding: requiredFindings[4],
      passed: readText("apps/web/src/features/layout-editor/LayoutInspectorPanel.tsx").includes("Selection type")
        && readText("apps/web/src/features/layout-editor/layoutInspectorViewModel.ts").includes("Owner ID")
    }
  ];
  const passed = sourceFindings.every((entry) => entry.passed);
  if (passed) {
    writeText(firstFailurePath, [
      "Reproduced before repair from default-branch source evidence:",
      ...requiredFindings.map((finding) => `- ${finding}`)
    ].join("\n"));
  }
  return { passed, mode: "source-baseline", sourceFindings };
}

function checkScopeBoundary() {
  return checkAll([
    fileIncludes("docs/verification/workspace-ux-repair-manifest.json", [
      "\"workspaceUxRepairGoNoGoStatus\": \"not_ready\"",
      "\"durableAssignmentFoundationStatus\": \"not_started\""
    ]),
    fileIncludes("docs/project/workspace-ux-foundation-status.md", [
      "Durable assignment sets",
      "Nurse profile builder",
      "Room load editor",
      "Burden scoring",
      "Scenario simulation",
      "Optimizer",
      "Management reports"
    ])
  ]);
}

function checkRootScriptWiring() {
  return checkAll([
    fileIncludes("package.json", Object.keys(workspaceUxRepairRootScripts).map((script) => `"${script}"`))
  ]);
}
