#!/usr/bin/env node
import { notImplementedGate, readArg } from "./lib/floorplan-editor-reconstruction-batch-utils.mjs";

notImplementedGate({
  gateName: "duplicate-labels",
  issue: readArg("--issue", "627"),
  stage: readArg("--stage", "final")
});
