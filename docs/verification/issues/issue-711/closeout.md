# Issue 711 Closeout

## Problem
Hide Future Tools from Normal Mode

## Code Review
- Future Tools was a top-level proof/workbench navigation concept; normal navigation now has no Future Tools group and keeps Advanced/Evidence secondary.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/app-shell/AppShell.tsx
- apps/web/src/features/app-shell/appNavigation.ts
- scripts/check-future-tools-hidden-normal-mode.mjs
- docs/verification/issues/issue-711/

## Commands Run
- node scripts/check-future-tools-hidden-normal-mode.mjs --stage future-tools-hidden --allow-partial --issue 711
- node scripts/check-future-tools-hidden-normal-mode.mjs --stage advanced-evidence-only --allow-partial --issue 711
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-711/closeout.md
- docs/verification/issues/issue-711/test-output/check-future-tools-hidden-normal-mode.txt

## Known Limitations
- Advanced routes remain reachable from the secondary rail disclosure; they are not normal workflow steps.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
