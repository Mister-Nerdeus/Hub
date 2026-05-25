# Issue 274 Closeout

## Summary
Polished the Plan 1 assumptions presentation into reader-facing display groups without changing simulation behavior. The panel remains read-only proof mode and keeps operational non-claims visible before interpreting dry-run output.

## Files Changed
- `packages/shared/src/scenario/plan1AssumptionDisplayGroups.ts`
- `packages/shared/src/index.ts`
- `packages/shared/tests/plan-1-assumption-display-groups.test.mjs`
- `apps/web/src/features/scenarios/Plan1AssumptionsPanel.tsx`
- `apps/web/src/features/scenarios/Plan1AssumptionsPanel.test.tsx`
- `apps/web/src/styles.css`
- `scripts/check-plan-1-demo-readiness.mjs`
- `docs/verification/plan-1-demo-readiness-manifest.json`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-274/`

## Commands Run
See `commands.txt` and `command-output-map.json`.

## Tests Passed/Failed
Passed:
- `npm --workspace packages/shared test`
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-plan-1-visual-parity.mjs --stage final --issue 274`
- `node scripts/check-plan-1-assignment-workflow.mjs --stage final --issue 274`
- `node scripts/check-plan-1-scenario-simulation.mjs --stage final --issue 274`
- `node scripts/check-plan-1-simulation-refinement.mjs --stage final --issue 274`
- `node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 274`
- `node scripts/check-plan-1-demo-readiness.mjs --stage assumptions-presentation --allow-partial --issue 274`

Failed:
- Initial local `npm --workspace packages/shared test` failed on a capitalization mismatch in the new display-label assertion; the assertion was corrected and the suite then passed.

## Evidence Artifacts
- `first-failure.txt`
- `assumptions-display-groups-output.json`
- `assumptions-polished-panel-output.json`
- `assumptions-non-claims-callout-output.json`
- `assumptions-reader-summary-output.md`
- `demo-readiness-manifest-output.json`
- `screenshots/plan-1-assumptions-polished.png`
- `test-output/`

## Known Limitations
Read-only proof mode is preserved. The panel improves presentation of deterministic synthetic assumptions but does not add editing, optimizer behavior, clinical safety certification, staffing compliance, or production deployment.

## Non-PHI Confirmation
Non-PHI rules still pass. The work uses synthetic assumptions and operational non-claims only; it adds no PHI, EHR fields, real patient identity, real staff identity, real employee identifiers, real hospital identifiers, medication names, diagnosis text, clinical notes, or staffing guidance.

## Next Recommended Issue
GO / NO-GO for Issue 275: GO.

Assumption groups added:
- What this simulation assumes
- Walking and route assumptions
- Task volume and duration assumptions
- Queue and interruption assumptions
- Warning thresholds
- What this simulation does NOT claim

Non-claims callout shown: yes.

Readability improvement summary: assumptions are now grouped into reader-facing sections with wrapped labels and an explicit read-only proof banner before the dry-run output is interpreted.
