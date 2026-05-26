# Issue 386 Closeout

## Summary
The first interactive Manual Assignment workspace is now available as its own app section. It supports synthetic nurse selection, click-to-assign, click reassignment, unassign, clear-all, nurse colors, nurse assignment cards, and unassigned occupied-room visibility.

## Files Changed
- package.json
- apps/web/src/App.tsx
- apps/web/src/features/app-shell/appNavigation.ts
- apps/web/src/features/manual-assignment/ManualAssignmentWorkspace.tsx
- apps/web/src/features/manual-assignment/ManualAssignmentRoomList.tsx
- apps/web/src/features/manual-assignment/NurseAssignmentCards.tsx
- apps/web/src/features/manual-assignment/AssignmentColorLegend.tsx
- apps/web/src/features/manual-assignment/manualAssignmentWorkspaceViewModel.ts
- apps/web/src/features/manual-assignment/__tests__/manualAssignmentWorkspace.test.tsx
- apps/web/src/features/manual-assignment/ManualAssignmentProof.css
- scripts/check-manual-assignment-ui.mjs
- scripts/check-canonical-gate-registry.mjs
- scripts/check-manual-assignment-foundation.mjs
- docs/verification/canonical-gate-registry.json
- docs/verification/manual-assignment-foundation-manifest.json
- docs/verification/issues/issue-386

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-manual-assignment-ui.mjs --issue 386
- node scripts/check-manual-assignment-foundation.mjs --stage assignment-ui --allow-partial --issue 386
- node scripts/check-canonical-gate-registry.mjs --issue 386
- node scripts/check-no-phi-fields.mjs
- node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 386
- node scripts/check-docs-contracts.mjs
- git diff --check

## Tests Passed/Failed
- Passed: shared tests, web tests, web build, manual assignment UI gate, manual assignment foundation stage gate, canonical gate registry, no-PHI check, default fixture nonmutation check, docs contract check, diff whitespace check.
- Failed: none remaining.

## Evidence Artifacts
- docs/verification/manual-assignment-foundation-manifest.json
- docs/verification/canonical-gate-registry.json
- docs/verification/issues/issue-386

## Known Limitations
- Manual visual approval is not claimed.
- Promotion remains blocked.
- Drag assignment is explicitly deferred; click assignment is the foundation behavior.
- This UI does not add optimizer behavior, automatic best assignment, burden scoring, walking burden, or full-shift simulation.

## Non-PHI Confirmation
- Non-PHI rules still pass. The UI uses synthetic nurse display profiles and synthetic room-load IDs only, with no PHI, EHR data, real patient identity, real nurse identity, optimizer behavior, full-shift simulation, or clinical safety claims.

## GO / NO-GO
GO for Issue 387.

## Next Recommended Issue
GO for Issue 387.
