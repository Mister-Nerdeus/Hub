#!/usr/bin/env node
import { runRepairBatchCheck } from "./lib/repair-batch-utils.mjs";
import { runManualOnlyBatchCheck } from "./lib/manual-only-batch-utils.mjs";

const issue = Number(process.argv[process.argv.indexOf("--issue") + 1] ?? "921");
if (issue >= 968) await runRepairBatchCheck("check-global-no-claims-guard");
else await runManualOnlyBatchCheck("check-global-no-claims-guard");
