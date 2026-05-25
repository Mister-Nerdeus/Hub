# Issue 278 Closeout - Full No-Claims / No-PHI Demo Audit

## Summary
Issue 278 adds a dedicated Plan 1 demo no-claims audit and wires it into the demo readiness gate. The audit scans Plan 1 demo-relevant shared code, fixtures, web UI, project docs, manifest-linked evidence, and local proof artifacts for prohibited claim language and prohibited data-field labels while confirming required non-claims remain present.

## Files changed
- `scripts/check-plan-1-demo-no-claims.mjs`
- `scripts/check-plan-1-demo-readiness.mjs`
- `docs/verification/plan-1-demo-readiness-manifest.json`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-278/*`

## Commands run
See `docs/verification/issues/issue-278/commands.txt` and `docs/verification/issues/issue-278/command-output-map.json`.

## Tests passed/failed
Passed:
- `npm --workspace packages/shared test`
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`
- `node scripts/check-plan-1-demo-no-claims.mjs --issue 278`
- `node scripts/check-plan-1-visual-parity.mjs --stage final --issue 278`
- `node scripts/check-plan-1-assignment-workflow.mjs --stage final --issue 278`
- `node scripts/check-plan-1-scenario-simulation.mjs --stage final --issue 278`
- `node scripts/check-plan-1-simulation-refinement.mjs --stage final --issue 278`
- `node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 278`
- `node scripts/check-plan-1-demo-readiness.mjs --stage no-claims-audit --allow-partial --issue 278`

Failed:
- Initial reproduced no-claims readiness gate failed because the dedicated audit artifacts were missing and the manifest did not reference Issue 278. Fixed by adding the audit gate, evidence outputs, manifest references, and readiness content checks.

## Evidence artifacts
- `first-failure.txt` captures the missing audit evidence before implementation.
- `no-claims-audit-output.json` reports zero prohibited claim findings.
- `no-phi-demo-audit-output.json` reports zero prohibited data-field findings.
- `prohibited-claim-negative-output.json` proves examples such as `safe staffing`, `unsafe staffing`, `staffing compliant`, `clinically safe`, `patient harm prediction`, `required nurse ratio`, and `certified staffing recommendation` are rejected.
- `prohibited-data-field-negative-output.json` proves data-like field labels are rejected without storing the exact prohibited field tokens in evidence.
- `required-non-claims-present-output.json` confirms all required non-claims are present.

## Known limitations
- This is a static and local evidence audit for Plan 1 demo surfaces, not a certification or exhaustive natural-language proof.
- The audit intentionally scopes to Plan 1 demo-relevant code, fixtures, docs, and manifest-linked evidence.

## Non-PHI confirmation
Non-PHI rules still pass. The dedicated demo audit and global no-PHI scanner both pass, and no PHI, real patient identity, real staff identity, real employee identifiers, real hospital identifiers, medication names, diagnosis text, clinical notes, EHR integration, staffing guidance, optimizer behavior, or production deployment was introduced.

## Next Recommended Issue
Issue 279 - Demo Readiness Screenshots and Route Matrix.

## GO / NO-GO for Issue 279
GO for Issue 279. The no-claims audit passes, the no-PHI audit passes, rejected claim-language examples are documented, required non-claims are present, and existing Plan 1 final gates plus Plans 2-5 unchanged checks still pass.
