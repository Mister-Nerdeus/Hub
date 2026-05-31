#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  loadWorkspaceUxManifest,
  readArg,
  statusFromChecks,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommonIssueArtifacts,
  writeJson,
  writeStageResult
} from "./lib/workspace-ux-foundation-utils.mjs";

const issue = readArg("--issue", "743");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-workspace-ux-go-no-go";
const title = "Workspace UX GO/NO-GO Audit";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "npm run check:clean-committed-state",
  "node scripts/check-workspace-ux-preflight.mjs --stage final --issue 743",
  "node scripts/check-no-phi-fields.mjs"
];

if (stage !== "final") {
  throw new Error(`Unsupported ${scriptName} stage: ${stage}`);
}

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, title, commands);
writeBoundaryOutputs(issue);

const manifest = loadWorkspaceUxManifest();
const checks = [];
const required = {
  workspaceUxGoNoGoStatus: "go_for_durable_assignment_foundation",
  goNoGoStatus: "go_for_next_milestone"
};

for (const [key, expected] of Object.entries(required)) {
  addCheck(checks, `${key} is ${expected}`, manifest[key] === expected, {
    actual: manifest[key],
    expected
  });
}

const status = statusFromChecks(checks);
writeJson(`docs/verification/issues/issue-${issue}/remaining-blockers.json`, {
  status,
  blockers: checks.filter((check) => !check.passed)
});
writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Final GO/NO-GO remains blocked until Milestone A issue validators update the manifest to the durable assignment foundation entry criteria.",
  filesChanged: [
    "docs/verification/workspace-ux-foundation-manifest.json",
    "docs/project/workspace-ux-foundation-status.md",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/remaining-blockers.json`,
    `docs/verification/issues/issue-${issue}/closeout.md`
  ],
  limitations: status === "passed" ? [] : ["Expected before final milestone closeout: Milestone A GO/NO-GO remains not_ready."]
});
writeStageResult(issue, scriptName, stage, checks, { manifest });
if (status !== "passed" && !allowPartial) process.exit(1);
