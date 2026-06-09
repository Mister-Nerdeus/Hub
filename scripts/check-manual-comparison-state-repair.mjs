#!/usr/bin/env node
import { runRepairBatchCheck } from "./lib/repair-batch-utils.mjs";
await runRepairBatchCheck("check-manual-comparison-state-repair");
