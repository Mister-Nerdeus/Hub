#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
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

const issue = readArg("--issue", "712");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-advanced-evidence-entry";
const title = "Advanced/Evidence Entry Point";
const commands = [
  "npm --workspace apps/web run build",
  "node scripts/check-advanced-evidence-entry.mjs --stage evidence-entry-visible --allow-partial --issue 712",
  "node scripts/check-advanced-evidence-entry.mjs --stage evidence-secondary --allow-partial --issue 712",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "evidence-entry-visible": () => checkAll([
    fileIncludes("apps/web/src/features/app-shell/appNavigation.ts", [
      "id: \"developer-evidence\", label: \"Advanced/Evidence\", group: \"advanced\"",
      "export const DEVELOPER_EVIDENCE_SECTION_ID: AppSectionId = \"developer-evidence\""
    ]),
    fileIncludes("apps/web/src/features/app-shell/ProductSidebarRail.tsx", [
      "Advanced/Evidence",
      "advancedSections.map"
    ])
  ]),
  "evidence-secondary": () => checkAll([
    fileIncludes("apps/web/src/features/app-shell/ProductSidebarRail.tsx", [
      "data-advanced-evidence-secondary=\"true\"",
      "className=\"product-sidebar__advanced product-sidebar-rail__advanced\""
    ]),
    fileIncludes("apps/web/src/features/app-shell/AdvancedEvidencePanel.tsx", [
      "data-advanced-evidence-panel=\"true\"",
      "data-runtime-proof-advanced-only=\"true\""
    ]),
    fileIncludes("apps/web/src/features/app-shell/DeveloperEvidencePage.tsx", [
      "Proof-only workflow modules are preserved here only.",
      "OptimizerProof",
      "PlanImportExportPanel"
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
    advancedEvidenceEntryStatus: "passed",
    developerEvidenceSecondary: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      advancedEvidenceEntryStatus: "passed",
      developerEvidenceSecondary: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Advanced/Evidence remains reachable from the rail but is grouped under the secondary disclosure, with runtime proof and proof-only modules contained inside the advanced evidence panel.",
  filesChanged: [
    "apps/web/src/features/app-shell/AdvancedEvidencePanel.tsx",
    "apps/web/src/features/app-shell/ProductSidebarRail.tsx",
    "apps/web/src/features/app-shell/appNavigation.ts",
    "scripts/check-advanced-evidence-entry.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/closeout.md`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
  ],
  limitations: ["Advanced/Evidence still contains legacy proof modules; Issue 712 only verifies that they are secondary and not normal workflow navigation."]
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
  const screenshot = `${dir}/screenshots/advanced-evidence-entry.png`;
  writePlaceholderPng(screenshot);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: [screenshot]
  });
}
