#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  loadDoorAuthoringManifest,
  readArg,
  statusFromChecks,
  writeBoundaryOutputs,
  writeEvidenceSlots,
  writeJson,
  writeTextIfMissing
} from "./lib/door-authoring-crash-hardening-utils.mjs";

const issue = readArg("--issue", "670");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: door crash reproduction harness is not complete.\n");

const manifest = loadDoorAuthoringManifest(issue);
const passed = manifest.doorCrashReproductionStatus === "passed" &&
  manifest.leftPodDoorCrashProof === true &&
  manifest.rightPodDoorCrashProof === true;
addCheck(checks, "door crash reproduction harness is complete", passed, manifest);
const status = statusFromChecks(checks);
writeJson(`${dir}/test-output/door-crash-reproduction.txt`, { status, issue, stage, checks });
writeEvidenceSlots(issue, "door-crash-reproduction", status, stage, checks);
console.log(JSON.stringify({ status, issue, stage, checks }, null, 2));
if (status !== "passed" && !allowPartial) process.exit(1);

