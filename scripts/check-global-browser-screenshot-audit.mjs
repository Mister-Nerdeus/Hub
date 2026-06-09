#!/usr/bin/env node
import { runRepairBatchCheck } from "./lib/repair-batch-utils.mjs";
import { runManualOnlyBatchCheck } from "./lib/manual-only-batch-utils.mjs";

const issue = Number(process.argv[process.argv.indexOf("--issue") + 1] ?? "924");
if (issue >= 967) await runRepairBatchCheck("check-global-browser-screenshot-audit");
else await runManualOnlyBatchCheck("check-global-browser-screenshot-audit");
