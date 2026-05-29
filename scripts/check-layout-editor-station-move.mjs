#!/usr/bin/env node
import { notImplementedGate, readArg } from "./lib/floorplan-editor-reconstruction-batch-utils.mjs";

notImplementedGate({
  gateName: "station-move",
  issue: readArg("--issue", "628"),
  stage: readArg("--stage", "final")
});
