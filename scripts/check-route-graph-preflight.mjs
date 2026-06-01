#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  fileExcludes,
  fileIncludes,
  packageScriptProof,
  readArg,
  routeRootScripts,
  statusFromChecks,
  updateRouteManifest,
  writeCloseout,
  writeCommandArtifacts,
  writeJson,
  writeStageResult
} from "./lib/route-graph-foundation-utils.mjs";

const issue = readArg("--issue", "848");
const stage = readArg("--stage", "final");
const scriptName = "check-route-graph-preflight";
const dir = `docs/verification/issues/issue-${issue}`;
const commands = [`node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`];
ensureIssueArtifacts(issue);
writeCommandArtifacts(issue, commands);
const packageProof = packageScriptProof(Object.keys(routeRootScripts));
const checks = [];
addCheck(checks, "route graph root scripts are visible in package.json", packageProof.status === "passed", packageProof);
addCheck(checks, "route graph manifest is scoped connectivity-only", fileIncludes("docs/verification/route-graph-foundation-manifest.json", ["connectivity_only", "simulationStillBlocked"]).passed);
addCheck(checks, "route graph status doc states out-of-scope work as blocked", fileIncludes("docs/project/route-graph-foundation-status.md", [
  "connectivity-only route graph foundation",
  "does not persist assignments",
  "choose assignments",
  "run execution flows",
  "rank options",
  "infer directional movement"
]).passed);
addCheck(checks, "route graph status doc has no clinical outcome claims", fileExcludes("docs/project/route-graph-foundation-status.md", ["clinical safety", "staffing compliance", "patient outcome"]).passed);
const status = statusFromChecks(checks);
writeJson(`${dir}/route-graph-preflight-output.json`, {
  status,
  routeGraphPreflightStatus: status,
  routeGraphScope: "connectivity_only",
  simulationStillBlocked: true,
  packageProof
});
if (status === "passed") {
  updateRouteManifest(issue, {
    routeGraphPreflightStatus: "passed",
    routeGraphScope: "connectivity_only",
    routeGraphRootScriptsStatus: "passed",
    simulationStillBlocked: true
  });
}
writeCloseout(issue, {
  title: "Route Graph Preflight",
  reviewFinding: "Route graph foundation is explicitly scoped as floorplan connectivity only with root scripts visible before contract implementation proceeds.",
  status,
  filesChanged: ["docs/verification/route-graph-foundation-manifest.json", "docs/project/route-graph-foundation-status.md", "scripts/check-route-graph-preflight.mjs", "scripts/check-route-graph-go-no-go.mjs", "package.json", `${dir}/`],
  commands,
  evidence: [`${dir}/route-graph-preflight-output.json`],
  limitations: ["Preflight only; route contracts and browser proof are separate gates."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);
