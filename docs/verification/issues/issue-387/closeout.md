# Issue 387 Closeout

## Summary
Route-aware walking and room-spread burden foundation is in place. Shared code now prefers deterministic path graph shortest paths and uses straight-line distance only as an explicit fallback; nurse assignment cards display walking/spread summaries.

## Files Changed
- package.json
- packages/shared/src/manual-assignment/walkingBurden.ts
- packages/shared/tests/walking-burden.test.mjs
- packages/shared/src/index.ts
- apps/web/src/features/manual-assignment/walkingBurdenViewModel.ts
- apps/web/src/features/manual-assignment/__tests__/walkingBurdenViewModel.test.ts
- apps/web/src/features/manual-assignment/manualAssignmentWorkspaceViewModel.ts
- apps/web/src/features/manual-assignment/NurseAssignmentCards.tsx
- apps/web/src/features/manual-assignment/__tests__/manualAssignmentWorkspace.test.tsx
- scripts/check-manual-assignment-burden.mjs
- scripts/check-canonical-gate-registry.mjs
- scripts/check-manual-assignment-foundation.mjs
- docs/verification/canonical-gate-registry.json
- docs/verification/manual-assignment-foundation-manifest.json
- docs/verification/issues/issue-387

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-manual-assignment-burden.mjs --issue 387
- node scripts/check-manual-assignment-foundation.mjs --stage walking-burden --allow-partial --issue 387
- node scripts/check-canonical-gate-registry.mjs --issue 387
- node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 387
- node scripts/check-no-phi-fields.mjs
- node scripts/check-docs-contracts.mjs
- git diff --check

## Tests Passed/Failed
- Passed: shared tests, web tests, web build, manual assignment burden gate, manual assignment foundation walking-burden gate, canonical gate registry, default fixture nonmutation check, no-PHI check, docs contract check, diff whitespace check.
- Failed: none remaining.

## Evidence Artifacts
- docs/verification/manual-assignment-foundation-manifest.json
- docs/verification/canonical-gate-registry.json
- docs/verification/issues/issue-387

## Known Limitations
- Manual visual approval is not claimed.
- Promotion remains blocked.
- Walking burden uses a synthetic route layout for the manual assignment foundation UI.
- This is route/spread burden foundation only; Issue 388 adds burden scoring and warnings.
- No optimizer behavior, automatic best assignment, full-shift timeline, clinical safety claim, or staffing compliance claim was added.

## Non-PHI Confirmation
- Non-PHI rules still pass. The walking burden layer uses synthetic room IDs, nurse IDs, path nodes, and distances only, with no PHI, EHR data, real patient identity, real nurse identity, optimizer behavior, full-shift simulation, or clinical safety claims.

## GO / NO-GO
GO for Issue 388.

## Next Recommended Issue
GO for Issue 388.
