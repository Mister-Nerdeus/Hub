# Issue 040 Closeout

## Summary

Updated the local docs checker so Phase 3 manual-assignment evidence is enforced the same way as the Phase 2 evidence gate. Missing Phase 3 evidence documentation, checklist, scoring output, warning output, or screenshot now fails `node scripts/check-docs-contracts.mjs`.

## Files Changed

- `scripts/check-docs-contracts.mjs`
- `README.md`
- `docs/codex/codex-operating-rules.md`
- `docs/verification/local-runs/latest/*`
- `docs/verification/issues/issue-040/commands.txt`
- `docs/verification/issues/issue-040/phase3-docs-check-negative-proof.txt`
- `docs/verification/issues/issue-040/closeout.md`

## Commands Run

See `docs/verification/issues/issue-040/commands.txt`.

## Tests Passed/Failed

Passed:

- `node scripts/check-docs-contracts.mjs`
- Temporary-copy negative proof for all five Phase 3 required evidence artifacts
- `node scripts/check-no-phi-fields.mjs`
- `npm --workspace packages/shared test`
- `npm --workspace apps/web test`
- `cd apps/api && python -m pytest`
- `npm --workspace apps/web run build`
- `npm run validate:plan -- packages/shared/fixtures/plan-er-pod-phase2.json`
- `docker compose down`
- `node scripts/verify-local.mjs`

Failed: None.

## Evidence

- `docs/verification/issues/issue-040/phase3-docs-check-negative-proof.txt`
- `docs/verification/local-runs/latest/docs-contract-output.txt`
- `docs/verification/local-runs/latest/manifest.json`

## Known Limitations

The docs checker enforces the required Phase 3 artifact paths and non-empty files. It does not semantically inspect screenshot pixels or recompute scoring and warning JSON content.

## Non-PHI Confirmation

No PHI fields, patient identity, clinical notes, EHR integration, diagnosis text, hidden scoring, optimizer behavior, or clinical safety certification claims were added. `node scripts/check-no-phi-fields.mjs` passes.

## Next Recommended Issue

Proceed to Phase 4 only after reviewing the committed local verifier evidence for Issues 039 and 040.
