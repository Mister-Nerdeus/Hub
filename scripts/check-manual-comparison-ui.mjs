#!/usr/bin/env node
import { runManualOnlyBatchCheck } from "./lib/manual-only-batch-utils.mjs";
await runManualOnlyBatchCheck("check-manual-comparison-ui");
