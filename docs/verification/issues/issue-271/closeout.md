# Issue 271 Closeout

## Summary

Added the Plan 1 demo-readiness manifest and a reusable issue traceability contract. The new demo-readiness gate validates scoped issue evidence, command-output-map references, required gate outputs, the evidence index entry, and the manifest.

## Files Changed

- scripts/check-plan-1-demo-readiness.mjs
- scripts/evidence/issueTraceabilityContract.mjs
- scripts/check-plan-1-scenario-simulation.mjs
- scripts/check-plan-1-simulation-refinement.mjs
- docs/verification/plan-1-demo-readiness-manifest.json
- docs/verification/ISSUE_EVIDENCE_INDEX.json
- docs/verification/issues/issue-271/

## Commands Run

- node scripts/check-plan-1-simulation-refinement.mjs --stage final
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-no-phi-fields.mjs
- node scripts/check-docs-contracts.mjs
- node scripts/check-plan-1-visual-parity.mjs --stage final --issue 271
- node scripts/check-plan-1-assignment-workflow.mjs --stage final --issue 271
- node scripts/check-plan-1-scenario-simulation.mjs --stage final --issue 271
- node scripts/check-plan-1-simulation-refinement.mjs --stage final --issue 271
- node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 271
- node scripts/check-plan-1-demo-readiness.mjs --stage traceability --allow-partial --issue 271

## Tests Passed

- Shared tests passed after rerunning serially; an earlier parallel run raced another shared build and is superseded by the captured passing output.
- Web tests passed.
- Web build passed.
- No-PHI, docs, Plan 1 final gates, Plans 2-5 unchanged, and demo-readiness traceability gate passed.

## Evidence Artifacts

- docs/verification/issues/issue-271/first-failure.txt
- docs/verification/issues/issue-271/evidence-traceability-before-output.json
- docs/verification/issues/issue-271/evidence-traceability-after-output.json
- docs/verification/issues/issue-271/issue-scope-validation-output.json
- docs/verification/issues/issue-271/command-output-map-validation-output.json
- docs/verification/issues/issue-271/demo-readiness-manifest-output.json
- docs/verification/issues/issue-271/evidence-index-update-output.json
- docs/verification/issues/issue-271/test-output/

## Known Limitations

Issue 271 establishes traceability and the canonical manifest only. Later issues in this batch still need to populate the guided workflow, narratives, assumptions polish, timeline/warning polish, seed pack, proof bundle, no-claims audit, and screenshot route matrix.

## Next Recommended Issue

GO for Issue 272.

## Non-PHI Confirmation

Non-PHI rules still pass. The change adds proof-contract metadata and does not introduce PHI, EHR fields, real identity data, optimizer behavior, or clinical/staffing claims.
