#!/usr/bin/env node
import { runManualOnlyBatchCheck } from "./lib/manual-only-batch-utils.mjs";
await runManualOnlyBatchCheck("check-global-manual-only-go-no-go");
