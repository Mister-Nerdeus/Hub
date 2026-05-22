# Forbidden Implementation Patterns

The following patterns are not allowed unless a later issue explicitly changes the project contract.

## Product Boundary Violations

- PHI, real patient identity, names, MRNs, dates of birth, contact details, or free-text clinical notes.
- EHR integration, imports, exports, or mapping workflows.
- Clinical safety certification language.
- Patient outcome prediction.
- Hidden scoring models or optimizer-only objective functions.

## Architecture Violations

- Optimizer implementation before scoring is complete.
- Separate scoring logic for manual and optimized assignments.
- Unseeded randomness in simulation logic.
- `Math.random()` in deterministic task generation or simulation logic.
- Hidden task timing assumptions outside the assumptions register and contract docs.
- Ambiguous unit conversion outside `pixelsPerUnit`.
- Saved plan JSON that includes transient UI state.
- Major dependencies without dependency matrix review.

## Evidence Violations

- Closing issues without `docs/verification/issues/issue-XXX/closeout.md`.
- Claiming tests passed without command evidence.
- Ignoring non-PHI scanner failures once the scanner exists.
- Omitting known limitations for commands that could not run.
