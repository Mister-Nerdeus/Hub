#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import {
  addCheck,
  ensureIssueArtifacts,
  packageScriptProof,
  readArg,
  readJson,
  runNoPhi,
  statusFromChecks,
  updateRouteManifest,
  writeCloseout,
  writeCommandArtifacts,
  writeJson,
  writeStageResult
} from "./lib/route-graph-foundation-utils.mjs";

const issue = readArg("--issue", "857");
const stage = readArg("--stage", "final");
const scriptName = "check-route-graph-evidence-closeout";
const dir = `docs/verification/issues/issue-${issue}`;
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "npm run check:route-graph-go-no-go",
  "npm run check:route-graph-browser-proof",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-no-phi-fields.mjs"
];
ensureIssueArtifacts(issue);
writeCommandArtifacts(issue, commands);

const requiredRootScripts = [
  "check:route-graph-preflight",
  "check:route-node-contract",
  "check:route-edge-contract",
  "check:route-graph-derivation",
  "check:route-graph-validation",
  "check:route-graph-overlay",
  "check:route-graph-save-reload-proof",
  "check:route-graph-browser-proof",
  "check:route-graph-go-no-go"
];
const requiredIssue855Artifacts = [
  "route-graph-browser-proof-output.json",
  "route-graph-browser-trace.json",
  "route-graph-before.json",
  "route-graph-after.json",
  "route-node-edge-stability-proof.json",
  "screenshot-index.json"
];
const issue855Dir = "docs/verification/issues/issue-855";
const manifest = readJson("docs/verification/route-graph-foundation-manifest.json");
const rootScriptProof = packageScriptProof(requiredRootScripts);
const browserArtifactProof = proveIssue855Artifacts();
const screenshotProof = proveScreenshots();
const noOverclaimProof = scanProofArtifacts([
  ...requiredIssue855Artifacts.map((name) => `${issue855Dir}/${name}`)
]);
const checks = [];
addCheck(checks, "manifest is go for assignment foundation", manifest.routeGraphGoNoGoStatus === "go_for_assignment_foundation", manifest);
addCheck(checks, "manifest scope remains connectivity only", manifest.routeGraphScope === "connectivity_only", manifest);
addCheck(checks, "execution remains blocked", manifest.simulationStillBlocked === true, manifest);
addCheck(checks, "route graph root scripts exist", rootScriptProof.status === "passed", rootScriptProof);
addCheck(checks, "Issue 855 browser artifacts exist", browserArtifactProof.status === "passed", browserArtifactProof);
addCheck(checks, "Issue 855 screenshots are real browser PNGs", screenshotProof.status === "passed", screenshotProof);
addCheck(checks, "browser proof artifacts contain no route overclaim strings", noOverclaimProof.status === "passed", noOverclaimProof);
const status = statusFromChecks(checks);

writeJson(`${dir}/route-graph-root-script-proof.json`, rootScriptProof);
writeJson(`${dir}/route-graph-browser-artifact-proof.json`, browserArtifactProof);
writeJson(`${dir}/screenshot-proof.json`, screenshotProof);
const output = {
  status,
  routeGraphEvidenceCloseoutStatus: status,
  routeGraphRootScriptsVerified: rootScriptProof.status === "passed",
  routeGraphBrowserArtifactsVerified: browserArtifactProof.status === "passed",
  routeGraphScreenshotsVerified: screenshotProof.status === "passed",
  routeGraphScopeStillConnectivityOnly: manifest.routeGraphScope === "connectivity_only",
  simulationStillBlocked: manifest.simulationStillBlocked === true
};
writeJson(`${dir}/route-graph-evidence-closeout-output.json`, output);
const noPhiPassed = runNoPhi(issue);
if (status === "passed") {
  updateRouteManifest(issue, {
    routeGraphEvidenceCloseoutStatus: "passed",
    routeGraphRootScriptsVerified: true,
    routeGraphBrowserArtifactsVerified: true,
    routeGraphScreenshotsVerified: true,
    routeGraphScope: "connectivity_only",
    simulationStillBlocked: true
  });
}
writeCloseout(issue, {
  title: "Route Graph Evidence Closeout",
  reviewFinding: "Route graph readiness needed a final local proof that root scripts and browser artifacts existed; this gate verifies manifest state, root wiring, Issue 855 browser proof, and screenshot integrity.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: ["scripts/check-route-graph-evidence-closeout.mjs", "package.json", "docs/project/route-graph-foundation-status.md", `${dir}/`],
  commands,
  evidence: [`${dir}/route-graph-evidence-closeout-output.json`, `${dir}/route-graph-root-script-proof.json`, `${dir}/route-graph-browser-artifact-proof.json`, `${dir}/screenshot-proof.json`],
  limitations: ["This gate verifies route graph evidence only."]
});
writeStageResult(issue, scriptName, stage, checks, output);
if (status !== "passed" || !noPhiPassed) process.exit(1);

function proveIssue855Artifacts() {
  const files = requiredIssue855Artifacts.map((name) => `${issue855Dir}/${name}`);
  const missing = files.filter((path) => !existsSync(path) || statSync(path).size === 0);
  return {
    status: missing.length === 0 && existsSync(`${issue855Dir}/screenshots`) ? "passed" : "failed",
    checked: [...files, `${issue855Dir}/screenshots`],
    missing
  };
}

function proveScreenshots() {
  const index = readJson(`${issue855Dir}/screenshot-index.json`);
  const screenshotFiles = index.screenshots.map((entry) => `${issue855Dir}/${entry.file}`);
  const directoryFiles = readdirSync(`${issue855Dir}/screenshots`)
    .filter((file) => file.endsWith(".png"))
    .map((file) => `${issue855Dir}/screenshots/${file}`);
  const expected = new Set(screenshotFiles);
  const missingFromDirectory = screenshotFiles.filter((path) => !existsSync(path));
  const unindexed = directoryFiles.filter((path) => !expected.has(path));
  const invalid = screenshotFiles.filter((path) => !isRealPng(path));
  return {
    status: missingFromDirectory.length === 0 && invalid.length === 0 && unindexed.length === 0 ? "passed" : "failed",
    referencedScreenshots: screenshotFiles.map((path) => ({ path, bytes: existsSync(path) ? statSync(path).size : 0 })),
    missingFromDirectory,
    unindexed,
    invalid
  };
}

function isRealPng(path) {
  if (!existsSync(path) || statSync(path).size < 5000) return false;
  const header = readFileSync(path).subarray(0, 8).toString("hex");
  return header === "89504e470d0a1a0a";
}

function scanProofArtifacts(paths) {
  const findings = [];
  for (const path of paths) {
    if (!existsSync(path)) continue;
    const values = stringValues(readJson(path));
    for (const value of values) {
      if (hasOverclaim(value)) findings.push({ path, value });
    }
  }
  return { status: findings.length === 0 ? "passed" : "failed", findings };
}

function stringValues(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringValues);
  if (value != null && typeof value === "object") return Object.values(value).flatMap(stringValues);
  return [];
}

function hasOverclaim(value) {
  return /\b(?:travel[- ]?time|burden score|workload score|staffing recommendation|assignment recommendation|optimizer output|simulation output|simulation result|clinical safety|staffing compliance|patient outcome)\b/i.test(value);
}
