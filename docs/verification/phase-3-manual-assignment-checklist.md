# Phase 3 Manual Assignment Checklist

## Initial Evidence Status

Before Phase 3 evidence was collected, the required scoring output, warning output, screenshot proof, local verifier output, and tracked evidence pack were missing.

## Final Evidence Status

| Criterion | Status | Evidence |
| --- | --- | --- |
| User can assign rooms to nurses through a manual assignment contract | Complete | `packages/shared/fixtures/manual-assignment-basic.json` |
| App shows over target ratio | Complete | `docs/verification/issues/issue-037/manual-assignment-output.json` |
| App shows different burden for same occupied-room count | Complete | `docs/verification/issues/issue-037/screenshots/manual-assignment-proof.png` |
| App shows warnings | Complete | `docs/verification/issues/issue-035/warning-output.json` |
| Evidence uses synthetic operational data only | Complete | `node scripts/check-no-phi-fields.mjs` |
| No seeded full-shift simulation output | Complete | No simulation code or artifacts added |
| No optimizer output | Complete | No optimizer code or artifacts added |
| Local verification from stopped Docker state | Complete | `node scripts/verify-local.mjs` |
