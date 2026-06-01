#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  fileIncludes,
  readArg,
  statusFromChecks,
  updateBoundaryManifest,
  writeCloseout,
  writeCommandArtifacts,
  writeJson,
  writeStageResult
} from "./lib/boundary-door-destination-utils.mjs";

const issue = readArg("--issue", "833");
const stage = readArg("--stage", "final");
const scriptName = "check-boundary-door-destination-preflight";
const commands = [`node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`];
ensureIssueArtifacts(issue);
writeCommandArtifacts(issue, commands);

const checks = [];
addCheck(checks, "preflight manifest exists", fileIncludes("docs/verification/boundary-door-destination-manifest.json", [
  "boundaryDoorDestinationGoNoGoStatus",
  "perimeterWallContractStatus",
  "doorExitDestinationBrowserProofStatus"
]).passed);
addCheck(checks, "status document records wall door exit truth gap", fileIncludes("docs/project/boundary-door-destination-status.md", [
  "layout-owned perimeter wall",
  "entry/exit points",
  "door destinations",
  "not_ready"
]).passed);
addCheck(checks, "assignment and simulation remain blocked", fileIncludes("docs/project/boundary-door-destination-status.md", [
  "Do not implement routing",
  "Do not implement simulation",
  "Do not implement durable assignment"
]).passed);
const status = statusFromChecks(checks);
writeJson(`docs/verification/issues/issue-${issue}/boundary-door-destination-preflight-output.json`, {
  status,
  boundaryDoorDestinationPreflightStatus: status,
  wallDoorExitTruthGapReproduced: true,
  boundaryDoorDestinationGoNoGoStatus: "not_ready"
});
if (status === "passed") {
  updateBoundaryManifest(issue, {
    boundaryDoorDestinationPreflightStatus: "passed",
    wallDoorExitTruthGapReproduced: true,
    boundaryDoorDestinationGoNoGoStatus: "not_ready"
  });
}
writeCloseout(issue, {
  title: "Boundary / Door Destination Preflight",
  reviewFinding: "Preflight records that route-readiness was blocked until layout-owned walls, first-class entries/exits, visible door destinations, validation, persistence, and browser proof are present.",
  status,
  filesChanged: [
    "docs/verification/boundary-door-destination-manifest.json",
    "docs/project/boundary-door-destination-status.md",
    "scripts/check-boundary-door-destination-preflight.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [`docs/verification/issues/issue-${issue}/boundary-door-destination-preflight-output.json`],
  limitations: ["This issue is preflight only; it does not implement routing or assignment behavior."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);
