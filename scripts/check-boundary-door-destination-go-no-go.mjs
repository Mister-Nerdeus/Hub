#!/usr/bin/env node
import {
  addCheck,
  boundaryRootScripts,
  ensureIssueArtifacts,
  fileIncludes,
  fileExcludes,
  readArg,
  readJson,
  runRootScript,
  statusFromChecks,
  updateBoundaryManifest,
  writeCloseout,
  writeCommandArtifacts,
  writeJson,
  writeStageResult
} from "./lib/boundary-door-destination-utils.mjs";

const issue = readArg("--issue", "843");
const stage = readArg("--stage", "final");
const scriptName = "check-boundary-door-destination-go-no-go";
const commands = [
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  ...Object.keys(boundaryRootScripts).filter((name) => name !== "check:boundary-door-destination-go-no-go").map((name) => `npm run ${name}`)
];
ensureIssueArtifacts(issue);
writeCommandArtifacts(issue, commands);

const validatorResults = Object.keys(boundaryRootScripts)
  .filter((name) => name !== "check:boundary-door-destination-go-no-go")
  .map(runRootScript);
const failedValidators = validatorResults.filter((result) => result.status !== "passed");
writeJson(`docs/verification/issues/issue-${issue}/validator-execution-output.json`, {
  status: failedValidators.length === 0 ? "passed" : "failed",
  validators: validatorResults
});

const manifest = readJson("docs/verification/boundary-door-destination-manifest.json");
const geometryManifest = readJson("docs/verification/geometry-truth-hardening-manifest.json");
const checks = [];
addCheck(checks, "boundary validators executed", failedValidators.length === 0, { failedValidators });
addCheck(checks, "geometry hardening consistency is clean", geometryManifest.geometryHardeningCloseoutConsistencyStatus === "passed" || geometryManifest.goNoGoStatus === "go_for_next_milestone", geometryManifest);
addCheck(checks, "all boundary manifest statuses passed", [
  "boundaryDoorDestinationPreflightStatus",
  "perimeterWallContractStatus",
  "entryExitContractStatus",
  "doorDestinationContractStatus",
  "boundaryDoorDestinationRendererStatus",
  "doorDestinationInspectorStatus",
  "doorDestinationValidationStatus",
  "boundaryDoorDestinationSaveReloadStatus",
  "doorExitDestinationBrowserProofStatus",
  "boundaryDoorDestinationRootScriptsStatus",
  "boundaryDoorDestinationDocumentationStatus"
].every((key) => manifest[key] === "passed"), manifest);
addCheck(checks, "no durable assignment contract exists", fileExcludes("packages/shared/src/contracts.ts", ["AssignmentSetContract"]).passed);
addCheck(checks, "api contract accepts boundary destination saved-plan fields", fileIncludes("apps/api/app/contracts.py", [
  "supportAccessPoints",
  "perimeterWalls",
  "entryExits",
  "doorDestinations"
]).passed);
const status = statusFromChecks(checks);
writeJson(`docs/verification/issues/issue-${issue}/boundary-door-destination-go-no-go-output.json`, {
  status,
  boundaryDoorDestinationGoNoGoStatus: status === "passed" ? "go_for_assignment_foundation_or_route_graph" : "not_ready",
  perimeterWallReady: status === "passed",
  entryExitReady: status === "passed",
  doorDestinationsReady: status === "passed",
  doorExitDestinationBrowserProofPassed: manifest.doorExitDestinationBrowserProofStatus === "passed",
  goNoGoStatus: status === "passed" ? "go_for_next_milestone" : "not_ready"
});
if (status === "passed") {
  updateBoundaryManifest(issue, {
    boundaryDoorDestinationGoNoGoStatus: "go_for_assignment_foundation_or_route_graph",
    perimeterWallReady: true,
    entryExitReady: true,
    doorDestinationsReady: true,
    doorExitDestinationBrowserProofPassed: true,
    goNoGoStatus: "go_for_next_milestone"
  });
}
writeCloseout(issue, {
  title: "Boundary / Door Destination GO/NO-GO",
  reviewFinding: "Final gate requires geometry hardening consistency, split-bay quarantine, all wall/entry/door-destination contracts, renderer, inspector, validation, persistence, browser proof, and local no-PHI boundaries.",
  status,
  filesChanged: ["scripts/check-boundary-door-destination-go-no-go.mjs", "docs/verification/boundary-door-destination-manifest.json", "docs/project/boundary-door-destination-status.md", `docs/verification/issues/issue-${issue}/`],
  commands,
  evidence: [`docs/verification/issues/issue-${issue}/boundary-door-destination-go-no-go-output.json`, `docs/verification/issues/issue-${issue}/validator-execution-output.json`],
  limitations: ["GO allows the next geometry-dependent milestone to start; it does not implement assignment foundation or route graph behavior."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);
