# Phase Plan Builder Input Evidence

This phase proves the user can enter core ER pod variables, generate a valid rendered plan, apply it to draft state, and continue using existing save/export/import behavior.

## Evidence Summary

- Plan Builder Defaults contract: `docs/contracts/plan-builder-defaults-contract.md`.
- Plan generation from defaults: `docs/contracts/plan-generation-from-defaults-contract.md`.
- Plan setup input form: `apps/web/src/features/plan-builder/PlanBuilderDefaultsForm.tsx`.
- Room defaults form: `apps/web/src/features/plan-builder/PlanBuilderDefaultsForm.tsx`.
- Hallway door nurse station defaults: `apps/web/src/features/plan-builder/PlanBuilderAdvancedDefaultsForm.tsx`.
- Generated plan preview: `apps/web/src/features/plan-builder/GeneratedPlanPreview.tsx`.
- Apply generated plan: `apps/web/src/features/plan-builder/generatedPlanPreviewViewModel.ts` and `replacePlan` dispatch in `apps/web/src/App.tsx`.

## Required Artifacts

- `docs/verification/phase-plan-builder-input-checklist.md`
- `docs/verification/issues/issue-081/defaults-output.json`
- `docs/verification/issues/issue-081/generated-plan-output.json`
- `docs/verification/issues/issue-081/screenshots/plan-builder-input-proof.png`
- `docs/verification/issues/issue-081/validation-output.txt`
- `docs/verification/issues/issue-081/commands.txt`
- `docs/verification/issues/issue-081/closeout.md`

## Boundaries

- No optimizer.
- No recommendation.
- No PHI.
- No patient identity.
- No diagnosis text.
- No clinical notes.
- No EHR import.
- No new API endpoints.
- No new persistence beyond existing plan save/load.
- No new nurse scoring, reporting, comparison, export, or audit behavior.

All evidence uses synthetic operational data only and is verified locally.
