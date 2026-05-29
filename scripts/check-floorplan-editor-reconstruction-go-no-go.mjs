#!/usr/bin/env node
import { notImplementedGate, readArg } from "./lib/floorplan-editor-reconstruction-batch-utils.mjs";

notImplementedGate({
  gateName: "floorplan-editor-reconstruction-go-no-go",
  issue: readArg("--issue", "630"),
  stage: readArg("--stage", "final")
});
