#!/usr/bin/env node
import { notImplementedGate, readArg } from "./lib/floorplan-editor-reconstruction-batch-utils.mjs";

notImplementedGate({
  gateName: "per-copy-autosave",
  issue: readArg("--issue", "623"),
  stage: readArg("--stage", "final")
});
