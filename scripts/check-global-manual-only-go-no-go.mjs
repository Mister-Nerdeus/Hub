#!/usr/bin/env node
import { runRepairBatchCheck } from "./lib/repair-batch-utils.mjs";
import { runManualOnlyBatchCheck } from "./lib/manual-only-batch-utils.mjs";

const issue = Number(process.argv[process.argv.indexOf("--issue") + 1] ?? "929");
if (issue >= 972) await runRepairBatchCheck("check-global-manual-only-go-no-go");
else await runManualOnlyBatchCheck("check-global-manual-only-go-no-go");
