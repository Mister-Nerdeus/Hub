#!/usr/bin/env node
import { runRepairBatchCheck } from "./lib/repair-batch-utils.mjs";
import { runManualOnlyBatchCheck } from "./lib/manual-only-batch-utils.mjs";

const issue = Number(process.argv[process.argv.indexOf("--issue") + 1] ?? "923");
if (issue >= 966) await runRepairBatchCheck("check-global-evidence-artifact-audit");
else await runManualOnlyBatchCheck("check-global-evidence-artifact-audit");
