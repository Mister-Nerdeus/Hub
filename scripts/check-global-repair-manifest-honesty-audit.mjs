#!/usr/bin/env node
import { runComparisonReadinessGlobalAudit } from "./lib/comparison-readiness-global-audit-utils.mjs";
await runComparisonReadinessGlobalAudit("check-global-repair-manifest-honesty-audit");
