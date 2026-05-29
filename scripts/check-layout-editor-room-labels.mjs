#!/usr/bin/env node
import { notImplementedGate, readArg } from "./lib/floorplan-editor-reconstruction-batch-utils.mjs";

notImplementedGate({
  gateName: "room-labels",
  issue: readArg("--issue", "626"),
  stage: readArg("--stage", "final")
});
