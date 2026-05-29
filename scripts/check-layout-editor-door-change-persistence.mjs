#!/usr/bin/env node
import { ensureIssueDirs, readArg, writeBoundaryOutputs, writeJson, writeTextIfMissing } from "./lib/floorplan-editor-save-reload-batch-utils.mjs";

const issue = readArg("--issue", "636");
const stage = readArg("--stage", "final");
const dir = `docs/verification/issues/issue-${issue}`;
ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: door geometry/count changes do not yet have same-record save/reload proof.\n");
writeJson(`${dir}/test-output/door-change-persistence.txt`, {
  status: "failed",
  stage,
  issue,
  message: "Issue 636 door-change persistence gate is not implemented yet."
});
console.error("Issue 636 door-change persistence gate is not implemented yet.");
process.exit(1);
