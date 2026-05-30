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

const issue = readArg("--issue", "671");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: safe door authoring wrapper is not complete.\n");

const manifest = loadDoorAuthoringManifest(issue);
const passed = manifest.safeDoorAuthoringWrapperStatus === "passed" &&
  manifest.doorActionsNonThrowing === true &&
  manifest.invalidDoorActionsBecomeWarnings === true;
addCheck(checks, "safe door authoring wrapper is complete", passed, manifest);
const status = statusFromChecks(checks);
writeJson(`${dir}/test-output/safe-door-authoring-wrapper.txt`, { status, issue, stage, checks });
writeEvidenceSlots(issue, "safe-door-authoring-wrapper", status, stage, checks);
console.log(JSON.stringify({ status, issue, stage, checks }, null, 2));
if (status !== "passed" && !allowPartial) process.exit(1);

