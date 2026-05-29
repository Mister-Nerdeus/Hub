#!/usr/bin/env node
import { notImplementedGate, readArg } from "./lib/floorplan-editor-reconstruction-batch-utils.mjs";

notImplementedGate({
  gateName: "draft-recovery-banner",
  issue: readArg("--issue", "624"),
  stage: readArg("--stage", "final")
});
