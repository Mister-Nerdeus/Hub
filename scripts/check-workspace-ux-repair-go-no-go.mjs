#!/usr/bin/env node
import {
  addCheck,
  checkAll,
  ensureIssueDirs,
  fileIncludes,
  hasFlag,
  loadRepairManifest,
  readArg,
  statusFromChecks,
  updateRepairManifest,
  workspaceUxRepairRequiredManifestFlags,
  writeCloseout,
  writeCommonIssueArtifacts,
  writeJson,
  writeStageResult
} from "./lib/workspace-ux-repair-utils.mjs";

const issue = readArg("--issue", "764");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-workspace-ux-repair-go-no-go";
const title = "Workspace UX Repair GO/NO-GO Audit";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "npm run check:clean-committed-state",
  "node scripts/check-global-horizontal-overflow.mjs --stage final --issue 764",
  "node scripts/check-active-floorplan-card-repair.mjs --stage final --issue 764",
  "node scripts/check-active-floorplan-hub-layout-balance.mjs --stage final --issue 764",
  "node scripts/check-floorplan-advanced-open-behavior.mjs --stage final --issue 764",
  "node scripts/check-floorplan-simulation-readiness-overclaim-repair.mjs --stage final --issue 764",
  "node scripts/check-compact-readiness-details-repair.mjs --stage final --issue 764",
  "node scripts/check-workflow-stepper-gating.mjs --stage final --issue 764",
  "node scripts/check-floorplan-hub-screenshot-proof.mjs --stage repaired-layout --issue 764",
  "node scripts/check-editor-bottom-details-copy-repair.mjs --stage final --issue 764",
  "node scripts/check-inspector-normal-advanced-section-split.mjs --stage final --issue 764",
  "node scripts/check-editor-bottom-panel-height.mjs --stage final --issue 764",
  "node scripts/check-editor-details-tab-simplification.mjs --stage final --issue 764",
  "node scripts/check-advanced-toolbar-responsive-repair.mjs --stage final --issue 764",
  "node scripts/check-editor-screenshot-proof.mjs --stage repaired-layout --issue 764",
  "node scripts/check-milestone-a-no-overclaim.mjs --stage final --issue 764",
  "node scripts/check-no-phi-fields.mjs"
];

if (stage !== "final" && stage !== "manifest") {
  throw new Error(`Unsupported ${scriptName} stage: ${stage}`);
}

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, title, commands);

const manifest = loadRepairManifest();
const requiredPassed = Object.keys(workspaceUxRepairRequiredManifestFlags)
  .filter((key) => !["workspaceUxRepairGoNoGoStatus", "durableAssignmentFoundationStatus"].includes(key));
const missing = requiredPassed.filter((key) => manifest[key] !== "passed");
const checks = [];
addCheck(checks, "repair manifest statuses passed", missing.length === 0, { missing });
addCheck(checks, "durable assignment foundation stayed blocked before audit", manifest.durableAssignmentFoundationStatus === "not_started", {
  durableAssignmentFoundationStatus: manifest.durableAssignmentFoundationStatus
});
addCheck(checks, "status doc keeps Milestone B out of scope", checkStatusDoc().passed, checkStatusDoc());

const status = statusFromChecks(checks);
if (status === "passed") {
  updateRepairManifest(issue, {
    workspaceUxRepairGoNoGoStatus: "go_for_durable_assignment_foundation",
    milestoneARepairStatus: "complete",
    goNoGoStatus: "go_for_next_milestone",
    durableAssignmentFoundationStatus: "not_started"
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      workspaceUxRepairGoNoGoStatus: "go_for_durable_assignment_foundation",
      milestoneARepairStatus: "complete",
      goNoGoStatus: "go_for_next_milestone"
    }
  });
}

writeJson(`docs/verification/issues/issue-${issue}/go-no-go-output.json`, {
  status,
  missing,
  manifestBeforeAudit: manifest
});

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The repair GO/NO-GO blocks durable assignment foundation until each targeted UX and truth repair writes a passed local manifest status.",
  filesChanged: [
    "scripts/check-workspace-ux-repair-go-no-go.mjs",
    "docs/project/workspace-ux-foundation-status.md",
    "docs/verification/workspace-ux-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/go-no-go-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`,
    "docs/verification/workspace-ux-repair-manifest.json"
  ],
  limitations: ["This audit authorizes the next foundation milestone only; it does not implement durable assignment sets."]
});

writeStageResult(issue, scriptName, stage, checks, { missing });
if (status !== "passed" && !allowPartial) process.exit(1);

function checkStatusDoc() {
  return checkAll([
    fileIncludes("docs/project/workspace-ux-foundation-status.md", [
      "Workspace UX repair status",
      "Durable assignment foundation remains not started",
      "No durable assignment sets, scoring, scenario simulation, optimizer, reports, or clinical claims are implemented by this repair batch."
    ])
  ]);
}
