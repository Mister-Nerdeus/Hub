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

const issue = readArg("--issue", "675");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: door recovery snapshots are not complete.\n");

const manifest = loadDoorAuthoringManifest(issue);
const passed = manifest.doorRecoverySnapshotsStatus === "passed" &&
  manifest.lastValidSnapshotProof === true;
addCheck(checks, "door recovery snapshots are complete", passed, manifest);
const status = statusFromChecks(checks);
writeJson(`${dir}/test-output/door-action-recovery-snapshots.txt`, { status, issue, stage, checks });
writeEvidenceSlots(issue, "door-action-recovery-snapshots", status, stage, checks);
console.log(JSON.stringify({ status, issue, stage, checks }, null, 2));
if (status !== "passed" && !allowPartial) process.exit(1);

