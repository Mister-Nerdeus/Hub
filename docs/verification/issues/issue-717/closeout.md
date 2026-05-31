# Issue 717 Closeout

## Problem
Floorplan Next-Step State Machine

## Code Review
- The hub next-step copy was static; the new view model chooses the next action from floorplan, placeholder assignment, and scenario assumption state without claiming assignment-set truth.

## Summary
- Local validator status: passed.

## Files Changed
- apps/web/src/features/floorplans/NextWorkflowStepCard.tsx
- apps/web/src/features/floorplans/nextWorkflowStepViewModel.ts
- apps/web/src/features/floorplans/ActiveFloorplanHub.tsx
- apps/web/src/App.tsx
- scripts/check-next-workflow-step-card.mjs
- scripts/check-milestone-a-no-overclaim.mjs
- docs/verification/issues/issue-717/

## Commands Run
- npm --workspace apps/web run build
- node scripts/check-next-workflow-step-card.mjs --stage state-machine --allow-partial --issue 717
- node scripts/check-next-workflow-step-card.mjs --stage assignment-next-step --allow-partial --issue 717
- node scripts/check-milestone-a-no-overclaim.mjs --stage no-assignment-truth-overclaim --issue 717
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local validator gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-717/closeout.md
- docs/verification/issues/issue-717/screenshot-index.json
- docs/verification/issues/issue-717/test-output/check-next-workflow-step-card.txt

## Known Limitations
- Assignment-set readiness is a placeholder input only; durable assignment data remains out of scope for Milestone A.

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
