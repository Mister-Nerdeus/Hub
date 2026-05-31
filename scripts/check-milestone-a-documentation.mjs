#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  fileIncludes,
  hasFlag,
  readArg,
  statusFromChecks,
  updateWorkspaceUxManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommonIssueArtifacts,
  writeJson,
  writeStageResult
} from "./lib/workspace-ux-foundation-utils.mjs";

const issue = readArg("--issue", "745");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-milestone-a-documentation";
const title = "Milestone A Documentation Update";
const commands = [
  "node scripts/check-milestone-a-documentation.mjs --stage final --issue 745",
  "node scripts/check-no-phi-fields.mjs"
];

if (stage !== "final") {
  throw new Error(`Unsupported ${scriptName} stage: ${stage}`);
}

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, title, commands);
writeBoundaryOutputs(issue);

const checks = [];
const docPath = "docs/project/workspace-ux-foundation-status.md";
const implemented = fileIncludes(docPath, [
  "Implemented in Milestone A:",
  "Shell and full-page workspace frame",
  "Compact workflow rail",
  "Workflow stepper",
  "Active floorplan hub",
  "Compact readiness summary",
  "Editor layout with canvas-first workspace"
]);
const notImplemented = fileIncludes(docPath, [
  "Not implemented in Milestone A:",
  "Durable assignment sets",
  "Nurse profile builder",
  "Room load editor",
  "Scoring",
  "Simulation",
  "Optimizer",
  "Reports"
]);
const nextMilestone = fileIncludes(docPath, [
  "Next milestone: durable assignment foundation."
]);

addCheck(checks, "documentation states implemented Milestone A workspace UX scope", implemented.passed, implemented);
addCheck(checks, "documentation states out-of-scope durable assignment and later workflow work", notImplemented.passed, notImplemented);
addCheck(checks, "documentation names durable assignment foundation as next milestone", nextMilestone.passed, nextMilestone);

const status = statusFromChecks(checks);
if (status === "passed") {
  updateWorkspaceUxManifest(issue, {
    milestoneADocumentationStatus: "passed"
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      milestoneADocumentationStatus: "passed"
    }
  });
}

writeJson(`docs/verification/issues/issue-${issue}/documentation-output.json`, {
  status,
  docPath
});
writeCloseout(issue, {
  title,
  status,
  reviewFinding: status === "passed"
    ? "Milestone A documentation clearly separates delivered workspace UX from future assignment, scoring, simulation, optimizer, and report work."
    : "Milestone A documentation is missing required implemented, not-implemented, or next-milestone scope statements.",
  filesChanged: [
    "docs/project/workspace-ux-foundation-status.md",
    "scripts/check-milestone-a-documentation.mjs",
    "docs/verification/workspace-ux-foundation-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/documentation-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`,
    `docs/verification/issues/issue-${issue}/closeout.md`
  ],
  limitations: [
    "This issue documents Milestone A scope; it does not start durable assignment data work."
  ]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" && !allowPartial) process.exit(1);
