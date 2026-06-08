#!/usr/bin/env node
import { runManualOnlyBatchCheck } from "./lib/manual-only-batch-utils.mjs";
await runManualOnlyBatchCheck("check-current-product-state-report");
