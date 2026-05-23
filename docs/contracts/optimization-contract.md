# Optimization Contract Boundary

This contract defines the shared boundary for operational optimizer work.

The boundary requires future candidates to reference:

- source scenario ID
- generated task set ID
- assignment set IDs
- named assumptions
- shared simulation score IDs

The boundary shell does not rank, choose, or recommend a candidate. Later baseline optimizer output uses the assignment variant runner and shared scoring path, with visible tie-breakers and operational-only language.

No clinical claim, EHR integration, hidden scoring model, API endpoint, persistence, or UI behavior is created by the boundary contract.
