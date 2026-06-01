#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  ensureManifest,
  fileIncludes,
  issuePath,
  readArg,
  readJson,
  runNoPhi,
  statusFromChecks,
  updateManifest,
  writeCloseout,
  writeCommands,
  writeJson,
  writeStageResult
} from "./lib/assignment-foundation-utils.mjs";

const issue = readArg("--issue", "862");
const stage = readArg("--stage", "final");
const scriptName = "check-assignment-foundation-preflight";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "npm run check:route-graph-micro-hardening-go-no-go",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-no-phi-fields.mjs"
];

ensureIssueArtifacts(issue);
writeCommands(issue, commands);
const routeManifest = readJson("docs/verification/route-graph-foundation-manifest.json");
const manifest = ensureManifest();
const routeProof = {
  status: routeManifest.assignmentFoundationCanStartNext === true &&
    routeManifest.routeGraphScope === "connectivity_only" &&
    routeManifest.simulationStillBlocked === true ? "passed" : "failed",
  assignmentFoundationCanStartNext: routeManifest.assignmentFoundationCanStartNext === true,
  routeGraphScope: routeManifest.routeGraphScope,
  simulationStillBlocked: routeManifest.simulationStillBlocked === true
};
writeJson(issuePath(issue, "route-graph-dependency-proof.json"), routeProof);

const checks = [];
addCheck(checks, "route graph dependency allows manual assignment foundation", routeProof.status === "passed", routeProof);
addCheck(checks, "manifest has manual-only defaults", manifest.assignmentScope === "manual_only" && manifest.assignmentFoundationGoNoGoStatus === "not_ready", manifest);
addCheck(checks, "status doc exists", fileIncludes("docs/project/assignment-foundation-status.md", ["manual_only"]).passed);
const status = statusFromChecks(checks);
const output = {
  status,
  assignmentFoundationPreflightStatus: status,
  assignmentScope: "manual_only",
  routeGraphDependencyVerified: routeProof.status === "passed",
  recommendationsStillBlocked: true,
  scoringStillBlocked: true,
  simulationStillBlocked: true
};
writeJson(issuePath(issue, "assignment-foundation-preflight-output.json"), output);
if (status === "passed") {
  updateManifest(issue, {
    assignmentFoundationPreflightStatus: "passed",
    assignmentScope: "manual_only",
    routeGraphDependencyVerified: true,
    recommendationsStillBlocked: true,
    scoringStillBlocked: true,
    simulationStillBlocked: true
  });
}
const noPhiPassed = runNoPhi(issue);
writeCloseout(issue, {
  title: "Assignment Foundation Preflight",
  reviewFinding: "Preflight verifies route graph readiness while keeping assignment foundation manual-only.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: [
    "docs/verification/assignment-foundation-manifest.json",
    "docs/project/assignment-foundation-status.md",
    "scripts/check-assignment-foundation-preflight.mjs",
    "scripts/check-assignment-foundation-go-no-go.mjs",
    "package.json",
    issuePath(issue)
  ],
  commands,
  evidence: [
    issuePath(issue, "assignment-foundation-preflight-output.json"),
    issuePath(issue, "route-graph-dependency-proof.json"),
    issuePath(issue, "manifest-update-output.json")
  ],
  limitations: ["This issue is preflight only; GO remains blocked until Issue 872."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);
