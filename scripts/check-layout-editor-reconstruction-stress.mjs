#!/usr/bin/env node
import { notImplementedGate, readArg } from "./lib/floorplan-editor-reconstruction-batch-utils.mjs";

notImplementedGate({
  gateName: "reconstruction-stress",
  issue: readArg("--issue", "629"),
  stage: readArg("--stage", "final")
});
