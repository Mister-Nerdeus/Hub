#!/usr/bin/env node
import { notImplementedGate, readArg } from "./lib/floorplan-editor-reconstruction-batch-utils.mjs";

notImplementedGate({
  gateName: "editor-error-boundary",
  issue: readArg("--issue", "625"),
  stage: readArg("--stage", "final")
});
