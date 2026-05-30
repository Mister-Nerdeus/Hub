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
  writeText,
  writeTextIfMissing
} from "./lib/door-authoring-crash-hardening-utils.mjs";

const issue = readArg("--issue", "678");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: final door authoring GO / NO-GO has not rerun all real validators.\n");

const manifest = loadDoorAuthoringManifest(issue);
const requiredPassed = [
  "doorCrashPreflightStatus",
  "doorCrashReproductionStatus",
  "safeDoorAuthoringWrapperStatus",
  "doorCandidateEligibilityStatus",
  "addDoorPreflightStatus",
  "doorOwnerModelStatus",
  "doorRecoverySnapshotsStatus",
  "recoveryDiagnosticsStatus",
  "doorRegressionPackStatus"
].filter((key) => manifest[key] !== "passed");
const requiredBooleans = [
  "doorActionsNonThrowing",
  "leftPodDoorCrashProof",
  "rightPodDoorCrashProof",
  "invalidDoorActionsBecomeWarnings",
  "candidateEligibilityProof",
  "solidWallDoorRejected",
  "supportAccessSeparatedFromPatientDoor",
  "lastValidSnapshotProof",
  "recoveryDiagnosticsVisible",
  "doorSaveReloadProof",
  "noRecoveryScreenDuringDoorWork"
].filter((key) => manifest[key] !== true);
const passed = requiredPassed.length === 0 && requiredBooleans.length === 0;
addCheck(checks, "door authoring GO / NO-GO prerequisites are complete", passed, { requiredPassed, requiredBooleans });
const status = statusFromChecks(checks);
writeJson(`${dir}/remaining-blockers.json`, {
  status: passed ? "passed" : "blocked",
  blockers: [...requiredPassed, ...requiredBooleans]
});
writeText(`${dir}/go-no-go.md`, `# Door Authoring GO / NO-GO

Decision: ${passed ? "GO for full ER floorplan reconstruction." : "NO-GO with exact blockers."}

Blockers:
${[...requiredPassed, ...requiredBooleans].length === 0 ? "- None" : [...requiredPassed, ...requiredBooleans].map((item) => `- ${item}`).join("\n")}
`);
writeJson(`${dir}/test-output/door-authoring-go-no-go.txt`, { status, issue, stage, checks });
writeEvidenceSlots(issue, "door-authoring-go-no-go", status, stage, checks);
console.log(JSON.stringify({ status, issue, stage, checks }, null, 2));
if (status !== "passed" && !allowPartial) process.exit(1);

