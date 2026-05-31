#!/usr/bin/env node
import { addCheck, ensureIssueArtifacts, fileExcludes, fileIncludes, readArg, statusFromChecks, updateHardeningManifest, writeCloseout, writeCommandArtifacts, writeStageResult } from "./lib/geometry-truth-hardening-utils.mjs";
const issue = readArg("--issue", "828");
const stage = readArg("--stage", "final");
const scriptName = "check-real-screenshot-proof-required";
const commands = [`node scripts/${scriptName}.mjs --stage no-placeholder-final-proof --issue ${issue}`, "node scripts/check-split-room-screenshot-proof.mjs --stage real-browser-screenshots --issue 828"];
ensureIssueArtifacts(issue, { screenshots: true }); writeCommandArtifacts(issue, commands);
const checks = [];
addCheck(checks, "convert-room validator no longer writes placeholder final proof", fileExcludes("scripts/check-convert-room-to-split-room.mjs", ["writePlaceholderPng"]).passed);
addCheck(checks, "hard browser regression writes screenshot-index and screenshots", fileIncludes("scripts/check-split-room-hard-browser-regression.mjs", ["withBrowserRenderedApp", "browser.screenshot", "screenshot-index.json"]).passed);
addCheck(checks, "GO/NO-GO rejects placeholder proof", fileIncludes("scripts/check-geometry-truth-hardening-go-no-go.mjs", ["placeholderProofRejectedForGo", "placeholderScreenshotsRejectedForFinalProof"]).passed);
const status = statusFromChecks(checks);
if (status === "passed") updateHardeningManifest(issue, { realGeometryScreenshotProofStatus: "passed", placeholderScreenshotsRejectedForFinalProof: true });
writeCloseout(issue, { title: "Replace Placeholder Screenshot Proof with Real Browser Screenshots", reviewFinding: "Final geometry hardening proof now rejects placeholder screenshot generation and depends on browser-rendered screenshot artifacts.", status, filesChanged: ["scripts/check-convert-room-to-split-room.mjs", "scripts/check-real-screenshot-proof-required.mjs", "scripts/check-split-room-hard-browser-regression.mjs", `docs/verification/issues/issue-${issue}/`], commands, evidence: [`docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`, `docs/verification/issues/issue-${issue}/manifest-update-output.json`], limitations: ["Issue 829 generates the browser screenshots consumed as final proof."] });
writeStageResult(issue, scriptName, stage, checks); if (status !== "passed") process.exit(1);
