#!/usr/bin/env node
import { existsSync } from "node:fs";
import { delay, waitForExpression, withBrowserRenderedApp } from "./lib/app-browser-proof.mjs";
import {
  addCheck,
  ensureIssueArtifacts,
  readArg,
  readJson,
  readText,
  runNoPhi,
  statusFromChecks,
  updateRouteManifest,
  writeCloseout,
  writeCommandArtifacts,
  writeJson,
  writeStageResult
} from "./lib/route-graph-foundation-utils.mjs";

const issue = readArg("--issue", "860");
const stage = readArg("--stage", "final");
const scriptName = "check-route-graph-no-overclaim";
const dir = `docs/verification/issues/issue-${issue}`;
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-route-graph-validation.mjs --stage final --issue 860",
  "node scripts/check-route-graph-browser-proof.mjs --stage final --issue 860",
  "node scripts/check-no-phi-fields.mjs"
];
ensureIssueArtifacts(issue);
writeCommandArtifacts(issue, commands);

const {
  canonicalErPodGeometryFixture,
  deriveRouteGraphFromGeometry,
  validateRouteGraphContract
} = await import("../packages/shared/dist/index.js");
const graph = deriveRouteGraphFromGeometry(canonicalErPodGeometryFixture);
const labelScan = scanGraphLabels(graph);
const contractRejects = proveContractRejects();
const uiCopyScan = await scanUiCopy();
const docScan = scanTextFiles([
  "docs/project/route-graph-foundation-status.md",
  "docs/project/route-graph-connectivity-model.md"
]);
const proofArtifactScan = scanJsonArtifacts([
  "docs/verification/issues/issue-855/route-graph-browser-proof-output.json",
  "docs/verification/issues/issue-855/route-graph-browser-trace.json",
  "docs/verification/issues/issue-855/route-graph-before.json",
  "docs/verification/issues/issue-855/route-graph-after.json",
  "docs/verification/issues/issue-855/route-node-edge-stability-proof.json"
]);
const checks = [];
addCheck(checks, "route node labels have no overclaim language", labelScan.nodeFindings.length === 0, labelScan.nodeFindings);
addCheck(checks, "route edge labels have no overclaim language", labelScan.edgeFindings.length === 0, labelScan.edgeFindings);
addCheck(checks, "route warning messages have no overclaim language", labelScan.warningFindings.length === 0, labelScan.warningFindings);
addCheck(checks, "contract rejects forbidden label and warning examples", contractRejects.status === "passed", contractRejects);
addCheck(checks, "route overlay source and browser body copy have no overclaim language", uiCopyScan.status === "passed", uiCopyScan);
addCheck(checks, "route graph docs have no overclaim language", docScan.status === "passed", docScan);
addCheck(checks, "route proof artifacts have no overclaim language", proofArtifactScan.status === "passed", proofArtifactScan);
addCheck(checks, "route graph remains connectivity only", graph.routeGraphScope === "connectivity_only", graph);
const status = statusFromChecks(checks);
writeJson(`${dir}/route-graph-label-scan-output.json`, labelScan);
writeJson(`${dir}/route-graph-ui-copy-scan-output.json`, uiCopyScan);
writeJson(`${dir}/route-graph-proof-artifact-scan-output.json`, proofArtifactScan);
writeJson(`${dir}/route-graph-no-overclaim-output.json`, {
  status,
  routeGraphNoOverclaimStatus: status,
  routeNodeLabelsNoOverclaim: labelScan.nodeFindings.length === 0,
  routeEdgeLabelsNoOverclaim: labelScan.edgeFindings.length === 0,
  routeOverlayCopyNoOverclaim: uiCopyScan.status === "passed",
  routeProofArtifactsNoOverclaim: proofArtifactScan.status === "passed",
  routeGraphStillConnectivityOnly: graph.routeGraphScope === "connectivity_only",
  allowedLanguage: ["connectivity", "route", "connected", "disconnected", "blocked", "unknown destination", "warning", "floorplan geometry"]
});
const noPhiPassed = runNoPhi(issue);
if (status === "passed") {
  updateRouteManifest(issue, {
    routeGraphNoOverclaimStatus: "passed",
    routeNodeLabelsNoOverclaim: true,
    routeEdgeLabelsNoOverclaim: true,
    routeOverlayCopyNoOverclaim: true,
    routeProofArtifactsNoOverclaim: true,
    routeGraphScope: "connectivity_only"
  });
}
writeCloseout(issue, {
  title: "Route Graph No-Overclaim Hardening",
  reviewFinding: "No-overclaim checks now cover route node labels, route edge labels, warning messages, overlay source copy, browser body copy, docs, and route graph proof artifacts.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: ["packages/shared/src/floorplans/routeNodeContract.ts", "packages/shared/src/floorplans/routeEdgeContract.ts", "packages/shared/src/floorplans/routeGraphContract.ts", "apps/web/src/features/layout-editor/RouteGraphOverlay.tsx", "scripts/check-route-graph-no-overclaim.mjs", `${dir}/`],
  commands,
  evidence: [`${dir}/route-graph-no-overclaim-output.json`, `${dir}/route-graph-label-scan-output.json`, `${dir}/route-graph-ui-copy-scan-output.json`, `${dir}/route-graph-proof-artifact-scan-output.json`],
  limitations: ["The scanner is scoped to route graph labels, UI copy, docs, and local proof artifacts."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);

function scanGraphLabels(graph) {
  return {
    status: "passed",
    nodeFindings: graph.nodes.flatMap((node) => claimFindings(node.label).map((match) => ({ routeNodeId: node.routeNodeId, match }))),
    edgeFindings: graph.edges.flatMap((edge) => claimFindings(edge.label).map((match) => ({ routeEdgeId: edge.routeEdgeId, match }))),
    warningFindings: graph.warnings.flatMap((warning) => claimFindings(warning.message).map((match) => ({ code: warning.code, match })))
  };
}

function proveContractRejects() {
  const valid = deriveRouteGraphFromGeometry(canonicalErPodGeometryFixture);
  const badNode = structuredClone(valid);
  badNode.nodes[0].label = "travel time";
  const badEdge = structuredClone(valid);
  badEdge.edges[0].label = "assignment recommendation";
  const badWarning = structuredClone(valid);
  badWarning.warnings[0].message = "clinical safety";
  const rejects = [
    throws(() => validateRouteGraphContract(badNode)),
    throws(() => validateRouteGraphContract(badEdge)),
    throws(() => validateRouteGraphContract(badWarning))
  ];
  return { status: rejects.every(Boolean) ? "passed" : "failed", rejects };
}

async function scanUiCopy() {
  const overlaySource = readText("apps/web/src/features/layout-editor/RouteGraphOverlay.tsx");
  const sourceFindings = claimFindings(overlaySource);
  const browserBody = await readBrowserBodyText();
  const browserFindings = claimFindings(browserBody);
  return {
    status: sourceFindings.length === 0 && browserFindings.length === 0 ? "passed" : "failed",
    sourceFindings,
    browserFindings,
    browserBodyTextLength: browserBody.length
  };
}

async function readBrowserBodyText() {
  const port = Number(readArg("--port", "6860"));
  const chromePort = Number(readArg("--chrome-port", "9860"));
  return (await withBrowserRenderedApp({ port, chromePort, width: 1440, height: 1100, initScript: unlockScript() }, async (browser) => {
    await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
    await browser.evaluate("localStorage.clear()");
    await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
    await waitForExpression(browser, `Array.from(document.querySelectorAll('button')).some((button) => button.textContent.trim() === 'Create working copy' && !button.disabled)`, 15_000);
    await browser.evaluate(`Array.from(document.querySelectorAll('button')).find((button) => button.textContent.trim() === 'Create working copy' && !button.disabled)?.click()`);
    await delay(500);
    await browser.evaluate(`Array.from(document.querySelectorAll('button')).find((item) => item.textContent.trim().startsWith('Show Routes') && !item.disabled)?.click()`);
    await delay(500);
    return browser.evaluate("document.body.textContent ?? ''");
  })).result;
}

function scanTextFiles(paths) {
  const findings = paths.flatMap((path) => claimFindings(readText(path)).map((match) => ({ path, match })));
  return { status: findings.length === 0 ? "passed" : "failed", findings };
}

function scanJsonArtifacts(paths) {
  const findings = [];
  for (const path of paths) {
    if (!existsSync(path)) continue;
    for (const value of stringValues(readJson(path))) {
      findings.push(...claimFindings(value).map((match) => ({ path, match })));
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

function claimFindings(value) {
  const patterns = [
    /\btravel[- ]?time\b/i,
    /\bburden score\b/i,
    /\bworkload score\b/i,
    /\bscore\b/i,
    /\bstaffing(?: compliance| recommendation)?\b/i,
    /\bassignment recommendation\b/i,
    /\boptimizer\b/i,
    /\bsimulation (?:output|result|claim)\b/i,
    /\bclinical safety\b/i,
    /\bpatient outcome\b/i
  ];
  return patterns.filter((pattern) => pattern.test(value)).map((pattern) => pattern.source);
}

function throws(callback) {
  try {
    callback();
    return false;
  } catch {
    return true;
  }
}

function unlockScript() {
  return "sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));";
}
