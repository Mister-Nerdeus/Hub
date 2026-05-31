# Geometry Truth Repair Status

## Status

Geometry truth repair is in progress. Durable assignment foundation remains blocked until rendered editor objects are classified, hallways and boundaries are modeled as geometry, reference overlays are separated from editable objects, and split rooms use a physical parent room with assignable bed positions.

## Current Preflight Findings

- Hallways render in the editor, but the current contract does not yet declare geometry layers or rendered object identity for every visible object.
- Outer walls and structural boundaries are still represented through older room/support visual conventions instead of first-class wall geometry.
- Reference/background and artifact-like visuals are not yet separated by a locked, toggleable reference overlay contract.
- Legacy split-room behavior still relies on split bay child room references; the target model is one parent room with two assignable bed positions.

## Scope Boundaries

- Durable assignment persistence is not implemented in this batch.
- Nurse profile builder, Room load editor, burden scoring, scenario simulation, optimizer, management reports, clinical safety claims, staffing compliance claims, patient outcome claims, EHR integration, and PHI are out of scope.

## Entry Criteria For Next Milestone

Durable assignment foundation may start only after stable assignment targets are derived from normal room positions, split-room bed positions, and hall-bed positions, with local verification artifacts passing.
