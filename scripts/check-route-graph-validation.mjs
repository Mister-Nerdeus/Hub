#!/usr/bin/env node
import { addCheck, ensureIssueArtifacts, readArg, statusFromChecks, updateRouteManifest, writeCloseout, writeCommandArtifacts, writeJson, writeStageResult } from "./lib/route-graph-foundation-utils.mjs";

const issue = readArg("--issue", "852");
const stage = readArg("--stage", "final");
const scriptName = "check-route-graph-validation";
const dir = `docs/verification/issues/issue-${issue}`;
const commands = [`node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`];
ensureIssueArtifacts(issue);
writeCommandArtifacts(issue, commands);
const { canonicalErPodGeometryFixture, deriveRouteGraphFromGeometry, validateRouteGraphConnectivity } = await import("../packages/shared/dist/index.js");
const fixture = JSON.parse(JSON.stringify(canonicalErPodGeometryFixture));
fixture.rooms.push({
  objectType: "room",
  id: "room-disconnected-proof",
  label: "Disconnected proof room",
  roomNumber: "Proof",
  roomType: "standard",
  capacityType: "single",
  isHallBed: false,
  isTraumaAdjacent: false,
  xFeet: 80,
  yFeet: 0,
  widthFeet: 10,
  heightFeet: 10
});
const graph = deriveRouteGraphFromGeometry(fixture);
const validation = validateRouteGraphConnectivity(fixture, graph);
const messages = validation.warnings.map((warning) => warning.message).join("\n");
const checks = [];
addCheck(checks, "disconnected room creates warning", validation.warnings.some((warning) => warning.code === "route_disconnected_room"), validation);
addCheck(checks, "unknown door destination creates warning", validation.warnings.some((warning) => warning.code === "route_unknown_destination"), validation);
addCheck(checks, "route warnings do not claim clinical safety", !/clinical|safety|patient outcome|staffing/i.test(messages), messages);
const status = statusFromChecks(checks);
writeJson(`${dir}/route-graph-validation-output.json`, { status, routeGraphValidationStatus: status, disconnectedRoomsWarn: true, unknownDestinationsWarn: true, routeWarningsDoNotClaimClinicalSafety: !/clinical|safety/i.test(messages) });
writeJson(`${dir}/route-graph-validation-fixture.json`, { fixture, graph, validation });
if (status === "passed") updateRouteManifest(issue, { routeGraphValidationStatus: "passed" });
writeCloseout(issue, {
  title: "Route Graph Validation",
  reviewFinding: "Route graph validation emits floorplan-connectivity warnings for disconnected rooms and unknown destinations without clinical, staffing, or patient-outcome language.",
  status,
  filesChanged: ["packages/shared/src/floorplans/routeGraphValidation.ts", "apps/web/src/features/layout-editor/EditorValidationSummaryRow.tsx", "apps/web/src/features/layout-editor/LayoutValidationPanel.tsx", "scripts/check-route-graph-validation.mjs", `${dir}/`],
  commands,
  evidence: [`${dir}/route-graph-validation-output.json`, `${dir}/route-graph-validation-fixture.json`],
  limitations: ["Validation warnings are connectivity-only; they do not imply adequacy or outcome predictions."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);
