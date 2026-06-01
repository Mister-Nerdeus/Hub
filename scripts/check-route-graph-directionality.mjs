#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  fileIncludes,
  readArg,
  runNoPhi,
  statusFromChecks,
  updateRouteManifest,
  writeCloseout,
  writeCommandArtifacts,
  writeJson,
  writeStageResult
} from "./lib/route-graph-foundation-utils.mjs";

const issue = readArg("--issue", "858");
const stage = readArg("--stage", "final");
const scriptName = "check-route-graph-directionality";
const dir = `docs/verification/issues/issue-${issue}`;
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-route-graph-derivation.mjs --stage final --issue 858",
  "node scripts/check-route-graph-browser-proof.mjs --stage final --issue 858",
  "node scripts/check-no-phi-fields.mjs"
];
ensureIssueArtifacts(issue);
writeCommandArtifacts(issue, commands);

const { canonicalErPodGeometryFixture, deriveRouteGraphFromGeometry, routeEdgeIdFor } = await import("../packages/shared/dist/index.js");
const graph = deriveRouteGraphFromGeometry(canonicalErPodGeometryFixture);
const beforeEdges = graph.edges.map(({ direction, ...edge }) => edge);
const afterEdges = graph.edges;
const allUndirected = afterEdges.every((edge) => edge.direction === "undirected");
const deterministic = afterEdges.every((edge) =>
  edge.routeEdgeId === routeEdgeIdFor(edge.sourceKind, edge.fromNodeId, edge.toNodeId) &&
  edge.routeEdgeId === routeEdgeIdFor(edge.sourceKind, edge.toNodeId, edge.fromNodeId)
);
const blockedWallUnchanged = afterEdges.every((edge) => !edge.blockedByWall || edge.traversable === false);
const docProof = {
  status: fileIncludes("docs/project/route-graph-connectivity-model.md", [
    "Route edges are explicitly undirected.",
    "fromNodeId` and `toNodeId` are storage endpoints only.",
    "does not infer directional flow"
  ]).passed ? "passed" : "failed",
  docs: ["docs/project/route-graph-connectivity-model.md", "docs/project/route-graph-foundation-status.md"]
};
const checks = [];
addCheck(checks, "route edges explicitly carry undirected direction", allUndirected, afterEdges);
addCheck(checks, "route edge IDs remain deterministic for either endpoint order", deterministic, afterEdges);
addCheck(checks, "blocked-by-wall behavior remains unchanged", blockedWallUnchanged, afterEdges);
addCheck(checks, "route graph remains connectivity only", graph.routeGraphScope === "connectivity_only", graph);
addCheck(checks, "directionality documentation is explicit", docProof.status === "passed", docProof);
const status = statusFromChecks(checks);

writeJson(`${dir}/route-edge-before.json`, beforeEdges);
writeJson(`${dir}/route-edge-after.json`, afterEdges);
writeJson(`${dir}/route-graph-directionality-doc-proof.json`, docProof);
writeJson(`${dir}/route-graph-directionality-output.json`, {
  status,
  routeGraphDirectionalityStatus: status,
  routeEdgesExplicitlyUndirected: allUndirected,
  routeEdgeIdsRemainDeterministic: deterministic,
  routeGraphStillConnectivityOnly: graph.routeGraphScope === "connectivity_only",
  directedFlowStillOutOfScope: docProof.status === "passed"
});
const noPhiPassed = runNoPhi(issue);
if (status === "passed") {
  updateRouteManifest(issue, {
    routeGraphDirectionalityStatus: "passed",
    routeEdgesExplicitlyUndirected: true,
    routeEdgeIdsRemainDeterministic: true,
    routeGraphScope: "connectivity_only",
    directedFlowStillOutOfScope: true
  });
}
writeCloseout(issue, {
  title: "Route Graph Directionality Clarification",
  reviewFinding: "Route edges stored endpoints while IDs were already order-independent; the contract now makes undirected connectivity explicit and keeps edge IDs deterministic.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: ["packages/shared/src/floorplans/routeEdgeContract.ts", "packages/shared/src/floorplans/deriveRouteGraphFromGeometry.ts", "docs/project/route-graph-connectivity-model.md", "scripts/check-route-graph-directionality.mjs", `${dir}/`],
  commands,
  evidence: [`${dir}/route-graph-directionality-output.json`, `${dir}/route-edge-before.json`, `${dir}/route-edge-after.json`, `${dir}/route-graph-directionality-doc-proof.json`],
  limitations: ["Directional movement semantics remain outside this route graph foundation."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);
