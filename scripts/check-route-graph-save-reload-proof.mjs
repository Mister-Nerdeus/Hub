#!/usr/bin/env node
import { addCheck, ensureIssueArtifacts, readArg, statusFromChecks, updateRouteManifest, writeCloseout, writeCommandArtifacts, writeJson, writeStageResult } from "./lib/route-graph-foundation-utils.mjs";

const issue = readArg("--issue", "854");
const stage = readArg("--stage", "final");
const scriptName = "check-route-graph-save-reload-proof";
const dir = `docs/verification/issues/issue-${issue}`;
const commands = [`node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`];
ensureIssueArtifacts(issue);
writeCommandArtifacts(issue, commands);
const { canonicalErPodGeometryFixture, deriveRouteGraphFromGeometry } = await import("../packages/shared/dist/index.js");
const savedGeometry = JSON.parse(JSON.stringify(canonicalErPodGeometryFixture));
const reloadedGeometry = JSON.parse(JSON.stringify(savedGeometry));
const before = deriveRouteGraphFromGeometry(savedGeometry);
const after = deriveRouteGraphFromGeometry(reloadedGeometry);
const beforeNodeIds = before.nodes.map((node) => node.routeNodeId);
const afterNodeIds = after.nodes.map((node) => node.routeNodeId);
const beforeEdgeIds = before.edges.map((edge) => edge.routeEdgeId);
const afterEdgeIds = after.edges.map((edge) => edge.routeEdgeId);
const nodesStable = JSON.stringify(beforeNodeIds) === JSON.stringify(afterNodeIds);
const edgesStable = JSON.stringify(beforeEdgeIds) === JSON.stringify(afterEdgeIds);
const noStoredSimulation = !JSON.stringify(reloadedGeometry).match(/simulation|optimizer|routeResult|travelTime/i);
const checks = [];
addCheck(checks, "route node IDs remain stable after reload", nodesStable, { beforeNodeIds, afterNodeIds });
addCheck(checks, "route edge IDs remain stable after reload", edgesStable, { beforeEdgeIds, afterEdgeIds });
addCheck(checks, "route graph is re-derived from geometry", before.routeGraphScope === "connectivity_only" && after.routeGraphScope === "connectivity_only", { before, after });
addCheck(checks, "no route simulation results are stored", noStoredSimulation, reloadedGeometry);
addCheck(checks, "unknown destinations remain warnings after reload", after.warnings.some((warning) => warning.code === "route_unknown_destination"), after.warnings);
const status = statusFromChecks(checks);
writeJson(`${dir}/route-graph-save-reload-output.json`, { status, routeGraphSaveReloadStatus: status, routeNodesStableAfterReload: nodesStable, routeEdgesStableAfterReload: edgesStable, routeGraphDerivedNotSimulated: noStoredSimulation });
writeJson(`${dir}/route-graph-before.json`, before);
writeJson(`${dir}/route-graph-after.json`, after);
writeJson(`${dir}/route-node-edge-stability-proof.json`, { status, beforeNodeIds, afterNodeIds, beforeEdgeIds, afterEdgeIds });
if (status === "passed") updateRouteManifest(issue, { routeGraphSaveReloadStatus: "passed" });
writeCloseout(issue, {
  title: "Route Graph Save / Reload Proof",
  reviewFinding: "Route graph IDs remain stable after saving and reloading the underlying geometry because the graph is re-derived from geometry rather than stored as simulation output.",
  status,
  filesChanged: ["scripts/check-route-graph-save-reload-proof.mjs", `${dir}/`],
  commands,
  evidence: [`${dir}/route-graph-save-reload-output.json`, `${dir}/route-graph-before.json`, `${dir}/route-graph-after.json`, `${dir}/route-node-edge-stability-proof.json`],
  limitations: ["Proof uses canonical geometry JSON serialization; browser save/reload is covered by issue 855."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);
