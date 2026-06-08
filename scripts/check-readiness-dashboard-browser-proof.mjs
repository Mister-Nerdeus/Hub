#!/usr/bin/env node
import { runManualOnlyBatchCheck } from "./lib/manual-only-batch-utils.mjs";
await runManualOnlyBatchCheck("check-readiness-dashboard-browser-proof");
