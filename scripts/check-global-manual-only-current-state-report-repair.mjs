#!/usr/bin/env node
import { runRepairBatchCheck } from "./lib/repair-batch-utils.mjs";
await runRepairBatchCheck("check-global-manual-only-current-state-report-repair");
