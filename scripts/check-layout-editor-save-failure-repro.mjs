#!/usr/bin/env node
import { ensureIssueDirs, readArg, writeBoundaryOutputs, writeJson, writeTextIfMissing } from "./lib/floorplan-editor-save-reload-batch-utils.mjs";

const issue = readArg("--issue", "632");
const stage = readArg("--stage", "final");
const dir = `docs/verification/issues/issue-${issue}`;
ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: user-reported room/door save loss does not yet have a red/green browser harness.\n");
writeJson(`${dir}/test-output/save-failure-repro.txt`, {
  status: "failed",
  stage,
  issue,
  message: "Issue 632 harness is not implemented yet."
});
console.error("Issue 632 save-failure reproduction harness is not implemented yet.");
process.exit(1);
