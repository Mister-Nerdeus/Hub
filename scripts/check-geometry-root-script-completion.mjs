#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  hardeningRootScripts,
  readArg,
  readJson,
  statusFromChecks,
  updateHardeningManifest,
  writeCloseout,
  writeCommandArtifacts,
  writeStageResult
} from "./lib/geometry-truth-hardening-utils.mjs";

const issue = readArg("--issue", "817");
const stage = readArg("--stage", "final");
const scriptName = "check-geometry-root-script-completion";
const commands = [
  `node scripts/${scriptName}.mjs --stage required-hardening-scripts --issue ${issue}`,
  "npm run check:geometry-truth-hardening-preflight"
];
ensureIssueArtifacts(issue);
writeCommandArtifacts(issue, commands);

if (!["required-hardening-scripts", "final"].includes(stage)) {
  throw new Error(`Unsupported ${scriptName} stage: ${stage}`);
}
const packageJson = readJson("package.json");
const checks = [];
for (const [name, command] of Object.entries(hardeningRootScripts)) {
  addCheck(checks, `${name} root script present`, packageJson.scripts?.[name] === command, {
    expected: command,
    actual: packageJson.scripts?.[name]
  });
}
const status = statusFromChecks(checks);
if (status === "passed") {
  updateHardeningManifest(issue, {
    geometryRootScriptHardeningStatus: "passed",
    requiredHardeningRootScriptsPresent: true
  });
}
writeCloseout(issue, {
  title: "Geometry Root Script Completion",
  reviewFinding: "Root scripts provide stable local commands for every Geometry Truth Hardening validator.",
  status,
  filesChanged: ["package.json", "scripts/check-geometry-root-script-completion.mjs", `docs/verification/issues/issue-${issue}/`],
  commands,
  evidence: [`docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`, `docs/verification/issues/issue-${issue}/manifest-update-output.json`],
  limitations: []
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);
