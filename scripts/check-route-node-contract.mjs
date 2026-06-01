#!/usr/bin/env node
import { addCheck, ensureIssueArtifacts, readArg, statusFromChecks, updateRouteManifest, writeCloseout, writeCommandArtifacts, writeJson, writeStageResult } from "./lib/route-graph-foundation-utils.mjs";

const issue = readArg("--issue", "849");
const stage = readArg("--stage", "final");
const scriptName = "check-route-node-contract";
const dir = `docs/verification/issues/issue-${issue}`;
const commands = [`node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`];
ensureIssueArtifacts(issue);
writeCommandArtifacts(issue, commands);
const { canonicalErPodGeometryFixture, deriveRouteGraphFromGeometry, routeNodeIdFor } = await import("../packages/shared/dist/index.js");
const graph = deriveRouteGraphFromGeometry(canonicalErPodGeometryFixture);
const nodes = graph.nodes;
const deterministic = nodes.every((node) => node.routeNodeId === routeNodeIdFor(node.sourceKind, node.sourceId));
const hasBed = nodes.some((node) => node.sourceKind === "bed_position");
const forbiddenKeys = nodes.flatMap((node) => Object.keys(node).filter((key) => /patient|staff|assignment|simulation|score|burden/i.test(key)));
const checks = [];
addCheck(checks, "route node IDs are deterministic", deterministic, nodes);
addCheck(checks, "route nodes are geometry-only", forbiddenKeys.length === 0, forbiddenKeys);
addCheck(checks, "split room bed positions create route nodes", hasBed, nodes);
const status = statusFromChecks(checks);
writeJson(`${dir}/route-node-contract-output.json`, { status, routeNodeContractStatus: status, routeNodesAreDeterministic: deterministic, routeNodesAreGeometryOnly: forbiddenKeys.length === 0 });
writeJson(`${dir}/route-node-fixture.json`, nodes);
if (status === "passed") updateRouteManifest(issue, { routeNodeContractStatus: "passed" });
writeCloseout(issue, {
  title: "Route Node Contract",
  reviewFinding: "Route nodes are deterministic, geometry-only records derived from rooms, doors, hallways, entries/exits, zones, support access, and split-room bed positions.",
  status,
  filesChanged: ["packages/shared/src/floorplans/routeNodeContract.ts", "packages/shared/src/floorplans/routeGraphContract.ts", "scripts/check-route-node-contract.mjs", `${dir}/`],
  commands,
  evidence: [`${dir}/route-node-contract-output.json`, `${dir}/route-node-fixture.json`],
  limitations: ["Route nodes contain connectivity geometry only; no routing times, assignments, burden scores, or simulation outputs are present."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);
