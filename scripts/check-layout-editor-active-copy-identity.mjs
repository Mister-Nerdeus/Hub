#!/usr/bin/env node
import { ensureIssueDirs, readArg, writeBoundaryOutputs, writeJson, writeTextIfMissing } from "./lib/floorplan-editor-save-reload-batch-utils.mjs";

const issue = readArg("--issue", "633");
const stage = readArg("--stage", "final");
const dir = `docs/verification/issues/issue-${issue}`;
ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: active saved-copy identity is not yet impossible to miss.\n");
writeJson(`${dir}/test-output/active-copy-identity.txt`, {
  status: "failed",
  stage,
  issue,
  message: "Issue 633 active-copy identity gate is not implemented yet."
});
console.error("Issue 633 active-copy identity gate is not implemented yet.");
process.exit(1);
