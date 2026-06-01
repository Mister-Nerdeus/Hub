#!/usr/bin/env node
import { addCheck, ensureIssueArtifacts, readArg, statusFromChecks, updateRouteManifest, writeCloseout, writeCommandArtifacts, writeJson, writeStageResult } from "./lib/route-graph-foundation-utils.mjs";

const issue = readArg("--issue", "851");
const stage = readArg("--stage", "final");
const scriptName = "check-route-graph-derivation";
const dir = `docs/verification/issues/issue-${issue}`;
const commands = [`node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`];
ensureIssueArtifacts(issue);
writeCommandArtifacts(issue, commands);
const { canonicalErPodGeometryFixture, deriveRouteGraphFromGeometry } = await import("../packages/shared/dist/index.js");
const graph = deriveRouteGraphFromGeometry(canonicalErPodGeometryFixture);
const second = deriveRouteGraphFromGeometry(JSON.parse(JSON.stringify(canonicalErPodGeometryFixture)));
const nodeKinds = new Set(graph.nodes.map((node) => node.sourceKind));
const hasDestinationEdges = graph.edges.some((edge) => edge.sourceKind === "door_destination");
const unknownDoor = canonicalErPodGeometryFixture.doorDestinations.find((destination) => destination.leadsToKind === "unknown");
const unknownFakeEdges = unknownDoor == null ? [] : graph.edges.filter((edge) => edge.label.includes(unknownDoor.doorId) && edge.traversable);
const checks = [];
addCheck(checks, "route graph derivation is deterministic", JSON.stringify(graph) === JSON.stringify(second), { graph, second });
addCheck(checks, "rooms create route nodes", nodeKinds.has("room"), graph.nodes);
addCheck(checks, "split-room bed positions create route nodes", nodeKinds.has("bed_position"), graph.nodes);
addCheck(checks, "door destinations create route edges", hasDestinationEdges, graph.edges);
addCheck(checks, "entry exits create route nodes", nodeKinds.has("entry_exit"), graph.nodes);
addCheck(checks, "hallways create route nodes", nodeKinds.has("hallway"), graph.nodes);
addCheck(checks, "unknown destinations warn instead of creating fake edges", unknownFakeEdges.length === 0 && graph.warnings.some((warning) => warning.code === "route_unknown_destination"), { unknownFakeEdges, warnings: graph.warnings });
const status = statusFromChecks(checks);
writeJson(`${dir}/route-graph-derivation-output.json`, { status, routeGraphDerivationStatus: status, routeGraphDerivedFromGeometry: true, unknownDestinationsDoNotCreateFakeEdges: unknownFakeEdges.length === 0 });
writeJson(`${dir}/route-graph-derived-fixture.json`, graph);
if (status === "passed") updateRouteManifest(issue, { routeGraphDerivationStatus: "passed" });
writeCloseout(issue, {
  title: "Route Graph Derivation from Geometry",
  reviewFinding: "Route graph derivation is deterministic and uses only floorplan geometry sources, with unknown destinations converted to warnings rather than inferred connectivity.",
  status,
  filesChanged: ["packages/shared/src/floorplans/deriveRouteGraphFromGeometry.ts", "packages/shared/src/floorplans/routeGraphContract.ts", "scripts/check-route-graph-derivation.mjs", `${dir}/`],
  commands,
  evidence: [`${dir}/route-graph-derivation-output.json`, `${dir}/route-graph-derived-fixture.json`],
  limitations: ["Derivation proves connectivity only and does not calculate route time, walking burden, staffing implications, or simulation output."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);
