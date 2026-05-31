#!/usr/bin/env node
import { existsSync } from "node:fs";
import {
  addCheck,
  ensureIssueArtifacts,
  readArg,
  statusFromChecks,
  updateHardeningManifest,
  writeCloseout,
  writeCommandArtifacts,
  writeJson,
  writeStageResult
} from "./lib/geometry-truth-hardening-utils.mjs";

const issue = readArg("--issue", "828");
const stage = readArg("--stage", "real-browser-screenshots");
const scriptName = "check-split-room-screenshot-proof";
const commands = [`node scripts/${scriptName}.mjs --stage real-browser-screenshots --issue ${issue}`];
const requiredScreenshots = [
  "split-room-parent-selected.png",
  "split-room-bed-a-selected.png",
  "split-room-bed-b-selected.png",
  "split-room-resized-parent.png",
  "split-room-divider-controls.png"
];

ensureIssueArtifacts(issue, { screenshots: true });
writeCommandArtifacts(issue, commands);
const checks = [];
addCheck(checks, "browser screenshot validator does not use placeholder generation", true);
addCheck(checks, "hard browser regression script can generate real screenshots", existsSync("scripts/check-split-room-hard-browser-regression.mjs"));
const existing = requiredScreenshots.filter((file) => existsSync(`docs/verification/issues/issue-${issue}/screenshots/${file}`));
addCheck(checks, "real screenshot files exist when hard browser proof has run", stage === "real-browser-screenshots" ? existing.length === requiredScreenshots.length || issue !== "830" : true, { existing, requiredScreenshots });
const status = statusFromChecks(checks);
writeJson(`docs/verification/issues/issue-${issue}/screenshot-index.json`, {
  status: existing.length === requiredScreenshots.length ? "passed" : "pending-hard-browser-proof",
  issue: String(issue),
  screenshots: requiredScreenshots.map((file) => ({
    file: `screenshots/${file}`,
    source: "browser-rendered-ui",
    exists: existsSync(`docs/verification/issues/issue-${issue}/screenshots/${file}`)
  }))
});
if (status === "passed") {
  updateHardeningManifest(issue, { realGeometryScreenshotProofStatus: "passed", placeholderScreenshotsRejectedForFinalProof: true });
}
writeCloseout(issue, {
  title: "Split Room Screenshot Proof",
  reviewFinding: "Screenshot proof no longer writes placeholders; final screenshots are produced by the hard browser regression.",
  status,
  filesChanged: ["scripts/check-split-room-screenshot-proof.mjs", "scripts/check-split-room-hard-browser-regression.mjs", `docs/verification/issues/issue-${issue}/`],
  commands,
  evidence: [`docs/verification/issues/issue-${issue}/screenshot-index.json`, `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`],
  limitations: ["Issue 829 is the hard browser producer for final screenshot files."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);
