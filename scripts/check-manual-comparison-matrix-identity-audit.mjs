#!/usr/bin/env node
import { runComparisonReadinessGlobalAudit } from "./lib/comparison-readiness-global-audit-utils.mjs";
await runComparisonReadinessGlobalAudit("check-manual-comparison-matrix-identity-audit");
