#!/usr/bin/env node
import { ensureIssueDirs, readArg, writeBoundaryOutputs, writeJson, writeTextIfMissing } from "./lib/floorplan-editor-save-reload-batch-utils.mjs";

const issue = readArg("--issue", "634");
const stage = readArg("--stage", "final");
const dir = `docs/verification/issues/issue-${issue}`;
ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: save pipeline does not yet trace room and door values across all persistence stages.\n");
writeJson(`${dir}/test-output/save-pipeline-trace.txt`, {
  status: "failed",
  stage,
  issue,
  message: "Issue 634 save-pipeline trace gate is not implemented yet."
});
console.error("Issue 634 save-pipeline trace gate is not implemented yet.");
process.exit(1);
