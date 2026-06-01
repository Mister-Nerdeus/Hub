#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  readArg,
  readJson,
  runNoPhi,
  runRootScript,
  statusFromChecks,
  updateRouteManifest,
  writeCloseout,
  writeCommandArtifacts,
  writeJson,
  writeStageResult
} from "./lib/route-graph-foundation-utils.mjs";

const issue = readArg("--issue", "861");
const stage = readArg("--stage", "final");
const scriptName = "check-route-graph-micro-hardening-go-no-go";
const dir = `docs/verification/issues/issue-${issue}`;
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "npm run check:clean-committed-state",
  "node scripts/check-route-graph-evidence-closeout.mjs --stage final --issue 861",
  "node scripts/check-route-graph-directionality.mjs --stage final --issue 861",
  "node scripts/check-perimeter-wall-warning-marker.mjs --stage final --issue 861",
  "node scripts/check-route-graph-no-overclaim.mjs --stage final --issue 861",
  "node scripts/check-route-graph-browser-proof.mjs --stage final --issue 861",
  "node scripts/check-no-phi-fields.mjs"
];
ensureIssueArtifacts(issue);
writeCommandArtifacts(issue, commands);

const validatorNames = [
  "check:clean-committed-state",
  "check:route-graph-evidence-closeout",
  "check:route-graph-directionality",
  "check:perimeter-wall-warning-marker",
  "check:route-graph-no-overclaim",
  "check:route-graph-browser-proof"
];
const validators = validatorNames.map(runRootScript);
writeJson(`${dir}/validator-execution-output.json`, {
  status: validators.every((result) => result.status === "passed") ? "passed" : "failed",
  validators
});
const manifest = readJson("docs/verification/route-graph-foundation-manifest.json");
const checks = [];
addCheck(checks, "micro-hardening validators passed", validators.every((result) => result.status === "passed"), validators);
addCheck(checks, "route graph evidence closeout passed", manifest.routeGraphEvidenceCloseoutStatus === "passed", manifest);
addCheck(checks, "route graph directionality passed", manifest.routeGraphDirectionalityStatus === "passed", manifest);
addCheck(checks, "perimeter wall warning marker passed", manifest.perimeterWallWarningMarkerStatus === "passed", manifest);
addCheck(checks, "route graph no-overclaim passed", manifest.routeGraphNoOverclaimStatus === "passed", manifest);
addCheck(checks, "route graph remains connectivity only", manifest.routeGraphScope === "connectivity_only", manifest);
addCheck(checks, "execution remains blocked", manifest.simulationStillBlocked === true, manifest);
const status = statusFromChecks(checks);
const output = {
  status,
  routeGraphMicroHardeningGoNoGoStatus: status === "passed" ? "go_for_assignment_foundation" : "not_ready",
  routeGraphEvidenceCloseoutStatus: manifest.routeGraphEvidenceCloseoutStatus === "passed" ? "passed" : "failed",
  routeGraphDirectionalityStatus: manifest.routeGraphDirectionalityStatus === "passed" ? "passed" : "failed",
  perimeterWallWarningMarkerStatus: manifest.perimeterWallWarningMarkerStatus === "passed" ? "passed" : "failed",
  routeGraphNoOverclaimStatus: manifest.routeGraphNoOverclaimStatus === "passed" ? "passed" : "failed",
  routeGraphStillConnectivityOnly: manifest.routeGraphScope === "connectivity_only",
  assignmentFoundationCanStartNext: status === "passed",
  simulationStillBlocked: manifest.simulationStillBlocked === true
};
writeJson(`${dir}/route-graph-micro-hardening-go-no-go-output.json`, output);
const noPhiPassed = runNoPhi(issue);
if (status === "passed") {
  updateRouteManifest(issue, {
    routeGraphMicroHardeningGoNoGoStatus: "go_for_assignment_foundation",
    routeGraphGoNoGoStatus: "go_for_assignment_foundation",
    routeGraphScope: "connectivity_only",
    assignmentFoundationCanStartNext: true,
    simulationStillBlocked: true
  });
}
writeCloseout(issue, {
  title: "Route Graph Micro-Hardening GO/NO-GO",
  reviewFinding: "The final micro-gate requires evidence closeout, explicit undirected route edges, perimeter-wall warning marker proof, no-overclaim hardening, browser proof, and local committed-state checks before assignment foundation starts.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: ["scripts/check-route-graph-micro-hardening-go-no-go.mjs", "docs/verification/route-graph-foundation-manifest.json", "docs/project/route-graph-foundation-status.md", `${dir}/`],
  commands,
  evidence: [`${dir}/route-graph-micro-hardening-go-no-go-output.json`, `${dir}/validator-execution-output.json`],
  limitations: ["GO applies only to assignment foundation readiness; route graph scope remains connectivity-only."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);
