#!/usr/bin/env node
import { runRepairBatchCheck } from "./lib/repair-batch-utils.mjs";
import { runManualOnlyBatchCheck } from "./lib/manual-only-batch-utils.mjs";

const issue = Number(process.argv[process.argv.indexOf("--issue") + 1] ?? "922");
if (issue >= 965) await runRepairBatchCheck("check-global-root-script-audit");
else await runManualOnlyBatchCheck("check-global-root-script-audit");
