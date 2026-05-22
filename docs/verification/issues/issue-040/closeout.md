# Issue 040 Closeout

## Summary

Added explicit Phase 3 evidence enforcement to the docs checker for the Phase 3 evidence doc, checklist, Issue 038 scoring output, warning output, screenshot, commands, and closeout artifacts. The checker also validates required Phase 3 evidence phrases so the docs cannot silently drift away from the gate.

## Files Changed

- `scripts/check-docs-contracts.mjs`
- `docs/codex/codex-operating-rules.md`
- `docs/verification/phase-3-manual-assignment-checklist.md`
- `docs/verification/phase-3-manual-assignment-evidence.md`
- `README.md`
- `docs/verification/issues/issue-040/*`

## Commands Run

See `docs/verification/issues/issue-040/commands.txt`.

## Tests Passed/Failed

Passed:

- `node scripts/check-docs-contracts.mjs`
- `node scripts/check-no-phi-fields.mjs`
- Negative proof for each required Phase 3 artifact listed in `negative-proof-output.txt`
- `docker compose down`
- `node scripts/verify-local.mjs`

## Evidence

- `failure-reproduction.txt`
- `negative-proof-output.txt`
- `docs-check-output.txt`

## Known Limitations

The requested pre-fix reproduction already failed for a missing Phase 3 evidence doc in this checkout. Issue 040 still expands the explicit Phase 3 gate to include all required Issue 038 artifacts and content checks.

## Non-PHI Confirmation

No PHI fields, real patient identity, diagnosis text, clinical notes, EHR integration, or clinical safety certification language were added. `node scripts/check-no-phi-fields.mjs` passed.

## Next Recommended Issue

Phase 4 planning can begin after the batch close gates pass and this commit is pushed.
