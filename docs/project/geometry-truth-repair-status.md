# Geometry Truth Repair Status

## Status

Geometry truth repair is in progress with the core geometry model now documented and locally verified through Issue 808. Durable assignment foundation remains blocked until the final GO/NO-GO and closeout issues confirm all batch gates together.

## Current Preflight Findings

- Geometry layers, rendered object identity, and editable geometry registries are defined for normal editor rendering.
- Hallways, outer walls, support/storage areas, and reference overlays have explicit contracts and local renderer evidence.
- Split rooms use the documented parent-room plus two assignable bed-position model.
- Legacy split-bay data has a non-destructive migration bridge with unsafe records flagged for review.

## Scope Boundaries

- Durable assignment persistence is not implemented in this batch.
- Nurse profile builder, Room load editor, burden scoring, scenario simulation, optimizer, management reports, clinical safety claims, staffing compliance claims, patient outcome claims, EHR integration, and PHI are out of scope.

## Entry Criteria For Next Milestone

Durable assignment foundation may start only after stable assignment targets are derived from normal room positions, split-room bed positions, and hall-bed positions, with local verification artifacts passing.
