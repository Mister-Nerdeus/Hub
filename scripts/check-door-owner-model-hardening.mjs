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

const issue = readArg("--issue", "674");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: explicit door owner model is not complete.\n");

const manifest = loadDoorAuthoringManifest(issue);
const passed = manifest.doorOwnerModelStatus === "passed";
addCheck(checks, "door owner model is complete", passed, manifest);
const status = statusFromChecks(checks);
writeJson(`${dir}/test-output/door-owner-model-hardening.txt`, { status, issue, stage, checks });
writeEvidenceSlots(issue, "door-owner-model-hardening", status, stage, checks);
console.log(JSON.stringify({ status, issue, stage, checks }, null, 2));
if (status !== "passed" && !allowPartial) process.exit(1);

