# Forbidden Implementation Patterns

The following patterns are not allowed unless a later issue explicitly changes the project contract.

## Product Boundary Violations

- PHI, real patient identity, names, MRNs, dates of birth, contact details, or free-text clinical notes.
- EHR integration, imports, exports, or mapping workflows.
- Clinical safety certification language.
- Safe-staffing or clinical-adequacy report language.
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
- Report builders that add UI, API endpoints, PDF export, persistence, optimizer behavior, task-completion simulation, walking route calculation, delay calculation, auto-fix behavior, or reassignment suggestions before those scopes are explicitly accepted.
- Export bundle integrity or audit features that add upload/download behavior, API endpoints, persistence, digital signatures, encryption, key management, chain-of-custody claims, non-repudiation claims, legal compliance claims, tamper-proof claims, reviewer identity, optimizer behavior, or recommendations.

## Evidence Violations

- Closing issues without `docs/verification/issues/issue-XXX/closeout.md`.
- Claiming tests passed without command evidence.
- Ignoring non-PHI scanner failures once the scanner exists.
- Omitting known limitations for commands that could not run.
