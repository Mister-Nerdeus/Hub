# Issue 709 Closeout

## Problem
Route-to-Step Mapping

## Code Review
- Route-level implementation screens now map into the five workflow steps, preventing editor and manual assignment from becoming separate top-level workflow steps.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/app-shell/appNavigation.ts
- apps/web/src/features/app-shell/productWorkflowSteps.ts
- apps/web/src/features/app-shell/productWorkflowStepViewModel.ts
- scripts/check-route-step-mapping.mjs
- docs/verification/issues/issue-709/

## Commands Run
- node scripts/check-route-step-mapping.mjs --stage editor-floorplan-map --allow-partial --issue 709
- node scripts/check-route-step-mapping.mjs --stage assignment-map --allow-partial --issue 709
- node scripts/check-route-step-mapping.mjs --stage scenarios-normal --allow-partial --issue 709
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-709/closeout.md
- docs/verification/issues/issue-709/test-output/check-route-step-mapping.txt

## Known Limitations
- This issue verifies route mapping only; it does not implement durable assignment data.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
