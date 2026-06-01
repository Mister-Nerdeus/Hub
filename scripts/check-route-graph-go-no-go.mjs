#!/usr/bin/env node
import { addCheck, ensureIssueArtifacts, readArg, readJson, runRootScript, statusFromChecks, updateRouteManifest, writeCloseout, writeCommandArtifacts, writeJson, writeStageResult } from "./lib/route-graph-foundation-utils.mjs";

const issue = readArg("--issue", "856");
const stage = readArg("--stage", "final");
const scriptName = "check-route-graph-go-no-go";
const dir = `docs/verification/issues/issue-${issue}`;
const commands = [
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "npm run check:final-geometry-evidence-audit",
  "npm run check:canonical-er-pod-geometry-fixture",
  "npm run check:locked-geometry-ux-proof",
  "npm run check:door-destination-ux-polish",
  "npm run check:route-graph-preflight",
  "npm run check:route-node-contract",
  "npm run check:route-edge-contract",
  "npm run check:route-graph-derivation",
  "npm run check:route-graph-validation",
  "npm run check:route-graph-overlay",
  "npm run check:route-graph-save-reload-proof",
  "npm run check:route-graph-browser-proof",
  "node scripts/check-no-phi-fields.mjs"
];
ensureIssueArtifacts(issue);
writeCommandArtifacts(issue, commands);
const validators = [
  "check:final-geometry-evidence-audit",
  "check:canonical-er-pod-geometry-fixture",
  "check:locked-geometry-ux-proof",
  "check:door-destination-ux-polish",
  "check:route-graph-preflight",
  "check:route-node-contract",
  "check:route-edge-contract",
  "check:route-graph-derivation",
  "check:route-graph-validation",
  "check:route-graph-overlay",
  "check:route-graph-save-reload-proof",
  "check:route-graph-browser-proof"
].map(runRootScript);
writeJson(`${dir}/validator-execution-output.json`, { status: validators.every((result) => result.status === "passed") ? "passed" : "failed", validators });
const routeManifest = readJson("docs/verification/route-graph-foundation-manifest.json");
const finalManifest = readJson("docs/verification/final-geometry-evidence-manifest.json");
const requiredRouteStatuses = [
  "routeGraphPreflightStatus",
  "routeNodeContractStatus",
  "routeEdgeContractStatus",
  "routeGraphDerivationStatus",
  "routeGraphValidationStatus",
  "routeGraphRendererStatus",
  "routeGraphSaveReloadStatus",
  "routeGraphBrowserProofStatus"
];
const checks = [];
addCheck(checks, "validators passed", validators.every((result) => result.status === "passed"), validators);
addCheck(checks, "final geometry evidence audit passed", finalManifest.finalGeometryEvidenceAuditStatus === "passed", finalManifest);
addCheck(checks, "route graph manifest statuses passed", requiredRouteStatuses.every((key) => routeManifest[key] === "passed"), routeManifest);
addCheck(checks, "simulation remains blocked", routeManifest.simulationStillBlocked === true, routeManifest);
const status = statusFromChecks(checks);
const output = {
  status,
  routeGraphGoNoGoStatus: status === "passed" ? "go_for_assignment_foundation" : "not_ready",
  floorplanPhysicalTruthReady: status === "passed",
  routeConnectivityReady: status === "passed",
  simulationStillBlocked: true,
  goNoGoStatus: status === "passed" ? "go_for_next_milestone" : "not_ready"
};
writeJson(`${dir}/route-graph-go-no-go-output.json`, output);
if (status === "passed") {
  updateRouteManifest(issue, {
    routeGraphGoNoGoStatus: "go_for_assignment_foundation",
    floorplanPhysicalTruthReady: true,
    routeConnectivityReady: true,
    simulationStillBlocked: true,
    goNoGoStatus: "go_for_next_milestone"
  });
}
writeCloseout(issue, {
  title: "Route Graph Foundation GO/NO-GO",
  reviewFinding: "GO requires final geometry evidence, canonical fixture, locked/door UX proof, route contracts, derivation, validation, overlay, save/reload proof, browser proof, and non-PHI boundaries before assignment foundation can proceed.",
  status,
  filesChanged: ["scripts/check-route-graph-go-no-go.mjs", "docs/verification/route-graph-foundation-manifest.json", "docs/project/route-graph-foundation-status.md", `${dir}/`],
  commands,
  evidence: [`${dir}/route-graph-go-no-go-output.json`, `${dir}/validator-execution-output.json`],
  limitations: ["GO is for assignment foundation readiness only; simulation and optimizer remain blocked."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);
