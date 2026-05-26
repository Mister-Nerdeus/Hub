# Default Fixture Promotion Protocol

Corrected saved copies may replace default fixtures only in a separately approved promotion-review batch.

## Required Evidence

- Corrected saved-copy JSON and hash.
- Rendered evidence generated from the corrected saved copy and hash.
- Machine visual sanity pass.
- Explicit manual visual review approval from outside Codex.
- Route audit pass or accepted warning.
- Simulation-ready export status accepted.
- Private-source boundary pass.
- No-PHI pass.
- Default fixture nonmutation proof before promotion.
- Rollback plan with hash.

## Blockers

Promotion is blocked when any required evidence is missing, manual visual review is not approved, route/export status is blocked, private-source or no-PHI checks fail, rollback evidence is missing, or the promotion was not separately requested.

Codex must not promote corrected saved copies during corrected-plan review. This protocol defines readiness only.
