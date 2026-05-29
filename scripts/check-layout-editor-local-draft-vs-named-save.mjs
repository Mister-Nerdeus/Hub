#!/usr/bin/env node
import { ensureIssueDirs, readArg, writeBoundaryOutputs, writeJson, writeTextIfMissing } from "./lib/floorplan-editor-save-reload-batch-utils.mjs";

const issue = readArg("--issue", "637");
const stage = readArg("--stage", "final");
const dir = `docs/verification/issues/issue-${issue}`;
ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: local recovery draft and named saved copy are not yet separately proven.\n");
writeJson(`${dir}/test-output/local-draft-vs-named-save.txt`, {
  status: "failed",
  stage,
  issue,
  message: "Issue 637 local-draft vs named-save gate is not implemented yet."
});
console.error("Issue 637 local-draft vs named-save gate is not implemented yet.");
process.exit(1);
