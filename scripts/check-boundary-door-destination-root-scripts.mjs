#!/usr/bin/env node
import {
  addCheck,
  boundaryRootScripts,
  ensureIssueArtifacts,
  fileIncludes,
  readArg,
  readJson,
  statusFromChecks,
  updateBoundaryManifest,
  writeCloseout,
  writeCommandArtifacts,
  writeJson,
  writeStageResult
} from "./lib/boundary-door-destination-utils.mjs";

const issue = readArg("--issue", "842");
const stage = readArg("--stage", "final");
const scriptName = "check-boundary-door-destination-root-scripts";
const commands = [`node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`];
ensureIssueArtifacts(issue);
writeCommandArtifacts(issue, commands);

const packageJson = readJson("package.json");
const checks = [];
for (const [name, command] of Object.entries(boundaryRootScripts)) {
  addCheck(checks, `${name} root script present`, packageJson.scripts?.[name] === command, {
    expected: command,
    actual: packageJson.scripts?.[name]
  });
}
addCheck(checks, "project docs describe model", fileIncludes("docs/project/floorplan-door-exit-destination-model.md", [
  "PerimeterWallContract",
  "EntryExitContract",
  "DoorDestinationContract"
]).passed);
const status = statusFromChecks(checks);
writeJson(`docs/verification/issues/issue-${issue}/boundary-door-destination-root-scripts-output.json`, {
  status,
  boundaryDoorDestinationRootScriptsStatus: status,
  boundaryDoorDestinationDocumentationStatus: status,
  requiredBoundaryDoorDestinationRootScriptsPresent: status === "passed"
});
if (status === "passed") {
  updateBoundaryManifest(issue, {
    boundaryDoorDestinationRootScriptsStatus: "passed",
    boundaryDoorDestinationDocumentationStatus: "passed",
    requiredBoundaryDoorDestinationRootScriptsPresent: true
  });
}
writeCloseout(issue, {
  title: "Boundary / Door Destination Root Scripts and Documentation",
  reviewFinding: "Root scripts now expose every boundary/door destination validator, and project documentation records the geometry model and boundaries.",
  status,
  filesChanged: ["package.json", "docs/project/boundary-door-destination-status.md", "docs/project/floorplan-door-exit-destination-model.md", "scripts/check-boundary-door-destination-root-scripts.mjs", `docs/verification/issues/issue-${issue}/`],
  commands,
  evidence: [`docs/verification/issues/issue-${issue}/boundary-door-destination-root-scripts-output.json`],
  limitations: []
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);
