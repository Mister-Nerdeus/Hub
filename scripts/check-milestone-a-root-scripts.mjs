#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  readArg,
  readJson,
  statusFromChecks,
  updateWorkspaceUxManifest,
  workspaceUxRootScripts,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommonIssueArtifacts,
  writeJson,
  writeStageResult
} from "./lib/workspace-ux-foundation-utils.mjs";
import { existsSync } from "node:fs";

const issue = readArg("--issue", "744");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-milestone-a-root-scripts";
const title = "Milestone A Root Script Finalization";
const commands = [
  "npm run check:milestone-a-root-scripts",
  "node scripts/check-no-phi-fields.mjs"
];

if (stage !== "final") {
  throw new Error(`Unsupported ${scriptName} stage: ${stage}`);
}

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, title, commands);
writeBoundaryOutputs(issue);

const packageJson = readJson("package.json");
const packageScripts = packageJson.scripts ?? {};
const checks = [];
const missingScripts = [];
const mismatchedScripts = [];
const missingScriptFiles = [];

for (const [scriptName, expectedCommand] of Object.entries(workspaceUxRootScripts)) {
  const actualCommand = packageScripts[scriptName];
  if (actualCommand == null) {
    missingScripts.push(scriptName);
    continue;
  }
  if (actualCommand !== expectedCommand) {
    mismatchedScripts.push({ scriptName, expectedCommand, actualCommand });
  }

  const scriptPath = expectedCommand.match(/^node\s+(scripts\/[^\s]+\.mjs)\b/)?.[1];
  if (scriptPath != null && !existsSync(scriptPath)) {
    missingScriptFiles.push(scriptPath);
  }
}

addCheck(checks, "all required Milestone A root script names exist", missingScripts.length === 0, { missingScripts });
addCheck(checks, "all required Milestone A root script commands are stable", mismatchedScripts.length === 0, { mismatchedScripts });
addCheck(checks, "all required Milestone A validator files exist", missingScriptFiles.length === 0, { missingScriptFiles });

const status = statusFromChecks(checks);
if (status === "passed") {
  updateWorkspaceUxManifest(issue, {
    milestoneARootScriptsStatus: "passed"
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      milestoneARootScriptsStatus: "passed"
    }
  });
}

writeJson(`docs/verification/issues/issue-${issue}/root-script-inventory-output.json`, {
  status,
  requiredRootScripts: Object.keys(workspaceUxRootScripts)
});
writeCloseout(issue, {
  title,
  status,
  reviewFinding: status === "passed"
    ? "Milestone A root scripts are present with stable commands."
    : "One or more Milestone A root scripts are missing or command text drifted.",
  filesChanged: [
    "package.json",
    "scripts/check-milestone-a-root-scripts.mjs",
    "docs/verification/workspace-ux-foundation-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/root-script-inventory-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`,
    `docs/verification/issues/issue-${issue}/closeout.md`
  ],
  limitations: [
    "This issue finalizes command wiring only; it does not reimplement the individual Milestone A validators."
  ]
});
writeStageResult(issue, scriptName, stage, checks, {
  requiredRootScripts: Object.keys(workspaceUxRootScripts)
});
if (status !== "passed" && !allowPartial) process.exit(1);
