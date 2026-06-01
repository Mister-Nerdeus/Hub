#!/usr/bin/env node
import { statSync } from "node:fs";
import {
  addCheck,
  ensureIssueArtifacts,
  fileExcludes,
  packageScriptProof,
  pathExists,
  readArg,
  readJson,
  statusFromChecks,
  updateFinalGeometryManifest,
  writeCloseout,
  writeCommandArtifacts,
  writeJson,
  writeStageResult
} from "./lib/route-graph-foundation-utils.mjs";
import { boundaryRootScripts } from "./lib/boundary-door-destination-utils.mjs";
import { hardeningRootScripts } from "./lib/geometry-truth-hardening-utils.mjs";

const issue = readArg("--issue", "844");
const stage = readArg("--stage", "final");
const scriptName = "check-final-geometry-evidence-audit";
const dir = `docs/verification/issues/issue-${issue}`;
const commands = [`node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`];

ensureIssueArtifacts(issue);
writeCommandArtifacts(issue, commands);

const rootScriptNames = [
  ...Object.keys(hardeningRootScripts),
  ...Object.keys(boundaryRootScripts),
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
  "check:route-graph-browser-proof",
  "check:route-graph-go-no-go"
];
const packageProof = packageScriptProof(rootScriptNames);
const hardeningManifest = readJson("docs/verification/geometry-truth-hardening-manifest.json");
const boundaryManifest = readJson("docs/verification/boundary-door-destination-manifest.json");
const splitRoomProof = artifactProof("829", [
  "split-room-parent-selected.png",
  "split-room-bed-a-selected.png",
  "split-room-bed-b-selected.png",
  "split-room-resized-parent.png",
  "split-room-divider-controls.png"
]);
const doorProof = artifactProof("841", [
  "perimeter-wall-selected.png",
  "entry-exit-destination-visible.png",
  "door-destination-edited.png",
  "presentation-destination-labels.png",
  "unknown-destination-warning.png"
]);
const checks = [];
addCheck(checks, "geometry hardening manifest is GO-ready", hardeningManifest.goNoGoStatus === "go_for_next_milestone", hardeningManifest);
addCheck(checks, "boundary door destination manifest is GO-ready", boundaryManifest.goNoGoStatus === "go_for_next_milestone", boundaryManifest);
addCheck(checks, "required root scripts visible in package.json", packageProof.status === "passed", packageProof);
addCheck(checks, "issue 829 split-room browser artifacts exist", splitRoomProof.status === "passed", splitRoomProof);
addCheck(checks, "issue 841 door/exit/destination browser artifacts exist", doorProof.status === "passed", doorProof);
addCheck(checks, "placeholder screenshots rejected", splitRoomProof.noPlaceholderFinalProof && doorProof.noPlaceholderFinalProof, { splitRoomProof, doorProof });
addCheck(checks, "no simulation or optimizer claims introduced by audit files", fileExcludes("docs/project/final-geometry-evidence-status.md", ["clinical safety", "patient outcome", "staffing adequacy", "optimizer before scoring"]).passed);
const status = statusFromChecks(checks);

writeJson(`${dir}/final-geometry-evidence-audit-output.json`, {
  status,
  finalGeometryEvidenceAuditStatus: status,
  hardeningRootScriptsVisibleInPackageJson: packageProof.status === "passed",
  splitRoomBrowserArtifactsVerified: splitRoomProof.status === "passed",
  doorExitDestinationBrowserArtifactsVerified: doorProof.status === "passed",
  noPlaceholderFinalProof: splitRoomProof.noPlaceholderFinalProof && doorProof.noPlaceholderFinalProof
});
writeJson(`${dir}/package-root-script-proof.json`, packageProof);
writeJson(`${dir}/split-room-browser-artifact-proof.json`, splitRoomProof);
writeJson(`${dir}/door-exit-destination-browser-artifact-proof.json`, doorProof);
if (status === "passed") {
  const manifest = updateFinalGeometryManifest(issue, {
    finalGeometryEvidenceAuditStatus: "passed",
    hardeningRootScriptsVisibleInPackageJson: true,
    splitRoomBrowserArtifactsVerified: true,
    doorExitDestinationBrowserArtifactsVerified: true,
    noPlaceholderFinalProof: true,
    goNoGoStatus: "go_for_route_graph_foundation"
  });
  writeJson(`${dir}/final-geometry-evidence-manifest-snapshot.json`, manifest);
}
writeCloseout(issue, {
  title: "Final Geometry Evidence Audit",
  reviewFinding: "Final geometry evidence now checks package root script visibility plus real browser proof artifacts for split rooms and door/exit destinations before route graph work proceeds.",
  status,
  filesChanged: ["docs/verification/final-geometry-evidence-manifest.json", "docs/project/final-geometry-evidence-status.md", "scripts/check-final-geometry-evidence-audit.mjs", "package.json", `${dir}/`],
  commands,
  evidence: [`${dir}/final-geometry-evidence-audit-output.json`, `${dir}/package-root-script-proof.json`, `${dir}/split-room-browser-artifact-proof.json`, `${dir}/door-exit-destination-browser-artifact-proof.json`],
  limitations: ["Audit only; route graph behavior is handled by later issues in the batch."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);

function artifactProof(issueNumber, screenshots) {
  const base = `docs/verification/issues/issue-${issueNumber}`;
  const files = screenshots.map((file) => ({
    file: `screenshots/${file}`,
    exists: pathExists(`${base}/screenshots/${file}`),
    bytes: pathExists(`${base}/screenshots/${file}`) ? statSync(`${base}/screenshots/${file}`).size : 0
  }));
  return {
    status: files.every((file) => file.exists && file.bytes > 1000) && pathExists(`${base}/screenshot-index.json`) ? "passed" : "failed",
    files,
    screenshotIndexExists: pathExists(`${base}/screenshot-index.json`),
    noPlaceholderFinalProof: files.every((file) => file.bytes > 1000)
  };
}
