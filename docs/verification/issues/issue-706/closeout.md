# Issue 706 Closeout

## Problem
Compact Workflow Rail

## Code Review
- The old normal navigation consumed a full row and exposed future/runtime surfaces; the compact rail now keeps only primary workflow entries visible and moves Advanced/Evidence into a secondary disclosure.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/app-shell/ProductSidebarRail.tsx
- apps/web/src/features/app-shell/productWorkflowSteps.ts
- apps/web/src/features/app-shell/productWorkflowStepViewModel.ts
- apps/web/src/features/app-shell/appShell.css
- scripts/check-product-shell-rail.mjs
- docs/verification/issues/issue-706/

## Commands Run
- node scripts/check-product-shell-rail.mjs --stage compact-rail --allow-partial --issue 706
- node scripts/check-product-shell-rail.mjs --stage workflow-items --allow-partial --issue 706
- node scripts/check-product-shell-rail.mjs --stage rail-width --allow-partial --issue 706
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-706/closeout.md
- docs/verification/issues/issue-706/screenshot-index.json
- docs/verification/issues/issue-706/test-output/check-product-shell-rail.txt

## Known Limitations
- Shared/web/build outputs are present as issue artifacts; full package tests were last rerun after the shell code change in issue 705.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
