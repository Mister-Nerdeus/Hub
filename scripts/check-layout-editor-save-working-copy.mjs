#!/usr/bin/env node
import { notImplementedGate, readArg } from "./lib/floorplan-editor-reconstruction-batch-utils.mjs";

notImplementedGate({
  gateName: "save-working-copy",
  issue: readArg("--issue", "622"),
  stage: readArg("--stage", "final")
});
