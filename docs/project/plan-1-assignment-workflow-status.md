# Plan 1 Assignment Workflow Status

Status: GO for Plan 1 assignment workflow foundation.

Scope is repaired Plan 1 only. The workflow uses the synthetic nurse profiles Nurse Blue, Nurse Green, Nurse Orange, and Nurse Purple; synthetic operational room-load codes; manual primary room assignments; validation warnings; nurse assignment cards; approximate graph-only walking preview; transparent operational burden scoring; and deterministic 3:1 vs 4:1 comparison fixtures.

Non-claims:

- Assignment outputs are operational comparison aids only.
- The workflow does not certify staffing safety, predict outcomes, integrate with EHRs, or use PHI.
- No optimizer, scenario builder, or full shift simulation behavior is introduced in this workflow foundation.

Known limits:

- Walking preview is approximate graph-only fixture routing, not measured walking truth.
- Edited layout exports preserve door/path graph metadata and therefore carry a blocking stale-path-sync warning before walking-aware assignment routing is used.
- Comparison fixtures are deterministic examples, not recommendations.
