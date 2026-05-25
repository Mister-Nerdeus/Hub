# Plan 1 Visual Parity Status

## Current Status

Issue 237 is complete. Plan 1 source mapping now includes explicit conversion provenance and covers required source-truth targets, while generated graph objects are marked as generated/inferred rather than source-visible.

## Completed

- Issue 229: source-truth contract and initial visual parity gate.
- Issue 230: deterministic gap audit for the simplified fixture.
- Issue 231: coordinate frame and scaffold regions.
- Issue 232: required room and patient-area geometry rebuild.
- Issue 233: zones, hallways, provider/pharmacy support zone, and two nurse stations.
- Issue 234: door/access-point coverage.
- Issue 235: path node and path edge graph rebuild.
- Issue 236: route preview and walking baseline rebuild.
- Issue 237: source mapping and conversion provenance repair.

## Current Mapping Counts

- Mapped objects: 127
- Deferred source labels: 4

## Next Recommended Issue

Issue 238: prove the repaired Plan 1 renders in the app from JSON fixture data.

## Non-Claims

- Not exact CAD geometry.
- Not measured walking truth.
- Not clinical safety certification.

## Issue 238 - App render visual parity proof

Status: Complete. Plan 1 renders from JSON fixture data through the app layout render pipeline with 23 room render items, 2 station render items, 1 Provider Pharmacy zone render item, required labels present, and old simplified render artifacts absent. Screenshot evidence is stored under `docs/verification/issues/issue-238/screenshots/`.

GO for Issue 239: editor export integrity for edited Plan 1.

## Issue 239 - Editor export integrity for edited Plan 1

Status: Complete. Editor export now rebuilds a PlanContract from the current editable layout and source plan, exporting room, station, and zone geometry edits while preserving doors/path graph with explicit deferred sync evidence.

GO for Issue 240: final Plan 1 visual parity audit.
