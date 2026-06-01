#!/usr/bin/env node
import { addCheck, ensureIssueArtifacts, readArg, statusFromChecks, updateRouteManifest, writeCloseout, writeCommandArtifacts, writeJson, writeStageResult } from "./lib/route-graph-foundation-utils.mjs";

const issue = readArg("--issue", "850");
const stage = readArg("--stage", "final");
const scriptName = "check-route-edge-contract";
const dir = `docs/verification/issues/issue-${issue}`;
const commands = [`node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`];
ensureIssueArtifacts(issue);
writeCommandArtifacts(issue, commands);
const { canonicalErPodGeometryFixture, deriveRouteGraphFromGeometry, routeEdgeIdFor } = await import("../packages/shared/dist/index.js");
const graph = deriveRouteGraphFromGeometry(canonicalErPodGeometryFixture);
const edges = graph.edges;
const deterministic = edges.every((edge) => edge.routeEdgeId === routeEdgeIdFor(edge.sourceKind, edge.fromNodeId, edge.toNodeId));
const forbiddenKeys = edges.flatMap((edge) => Object.keys(edge).filter((key) => /distance|time|burden|staff|assignment|score/i.test(key)));
const blockedNotTraversable = edges.every((edge) => !edge.blockedByWall || edge.traversable === false);
const checks = [];
addCheck(checks, "route edge IDs are deterministic", deterministic, edges);
addCheck(checks, "route edges are connectivity-only", forbiddenKeys.length === 0, forbiddenKeys);
addCheck(checks, "blocked wall edges are not traversable", blockedNotTraversable, edges);
addCheck(checks, "unknown destinations do not create fake traversable edges", !edges.some((edge) => edge.label.includes("Unknown destination")), edges);
const status = statusFromChecks(checks);
writeJson(`${dir}/route-edge-contract-output.json`, { status, routeEdgeContractStatus: status, routeEdgesAreConnectivityOnly: forbiddenKeys.length === 0, blockedWallEdgesNotTraversable: blockedNotTraversable });
writeJson(`${dir}/route-edge-fixture.json`, edges);
if (status === "passed") updateRouteManifest(issue, { routeEdgeContractStatus: "passed" });
writeCloseout(issue, {
  title: "Route Edge Contract",
  reviewFinding: "Route edges record deterministic connectivity only; blocked-by-wall edges cannot be traversable and unknown destinations do not produce fake traversable edges.",
  status,
  filesChanged: ["packages/shared/src/floorplans/routeEdgeContract.ts", "packages/shared/src/floorplans/routeGraphContract.ts", "scripts/check-route-edge-contract.mjs", `${dir}/`],
  commands,
  evidence: [`${dir}/route-edge-contract-output.json`, `${dir}/route-edge-fixture.json`],
  limitations: ["Edges intentionally omit distance, travel-time, burden, staffing, scoring, and simulation fields."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);
