# Batch 591-600 Code Review Findings

Status: resolved.

## Findings
- Root verification gap: Issue 600 added `scripts/check-simulation-v0-user-facing-readiness.mjs`, but the gate was not exposed as a root npm script. Fixed by adding `check:simulation-v0-user-facing-readiness`.
- Committed-state coverage gap: `check-clean-committed-state.mjs` still required repair evidence only through Issue 598 and did not require the Issue 599/600 decision and readiness artifacts. Fixed by requiring Issues 591-600 plus the readiness decision files and script.
- Docker boundary gap: production Docker images did not carry explicit product/non-PHI/EHR boundary metadata, and the Docker runtime checker did not enforce it. Fixed by adding OCI labels to production API/web images and checking those labels in `check-production-docker-runtime.mjs`.

## Review Result
No unresolved blockers remain for the Batch 591-600 false-positive repair requirements. The final manifest still reports GO for expanded Simulation v0 user-facing refinement, with Simulation v0 bounded as internal synthetic dry-run only.
