#!/usr/bin/env node
import { ensureIssueDirs, readArg, writeBoundaryOutputs, writeJson, writeTextIfMissing } from "./lib/floorplan-editor-save-reload-batch-utils.mjs";

const issue = readArg("--issue", "635");
const stage = readArg("--stage", "final");
const dir = `docs/verification/issues/issue-${issue}`;
ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: moved room geometry does not yet have same-record save/reload proof.\n");
writeJson(`${dir}/test-output/room-move-persistence.txt`, {
  status: "failed",
  stage,
  issue,
  message: "Issue 635 room-move persistence gate is not implemented yet."
});
console.error("Issue 635 room-move persistence gate is not implemented yet.");
process.exit(1);
