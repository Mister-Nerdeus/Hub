#!/usr/bin/env node
import { ensureIssueDirs, readArg, writeBoundaryOutputs, writeJson, writeTextIfMissing } from "./lib/floorplan-editor-save-reload-batch-utils.mjs";

const issue = readArg("--issue", "638");
const stage = readArg("--stage", "final");
const dir = `docs/verification/issues/issue-${issue}`;
ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: save status UI still can imply named-copy persistence without reload proof.\n");
writeJson(`${dir}/test-output/truthful-save-status.txt`, {
  status: "failed",
  stage,
  issue,
  message: "Issue 638 truthful save-status gate is not implemented yet."
});
console.error("Issue 638 truthful save-status gate is not implemented yet.");
process.exit(1);
