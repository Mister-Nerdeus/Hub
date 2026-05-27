# Storage and Solid-Wall Path Graph Rules

The ER Pod Shift Simulator uses one canonical floorplan direction. Storage and solid-wall semantics layer onto that floorplan and do not create a multi-floorplan product path.

## Rules
- Patient-care routing destinations are limited to room types eligible for both path nodes and burden scoring.
- Storage may exist as a physical layout object, but it is excluded from patient-care route destinations and nurse room-to-room walking burden calculations.
- Solid wall / blocked area is travel-blocking, non-routable, and cannot own room path nodes, room-door path nodes, or route graph edges.
- Existing local proof remains scenario-readiness only. This is not full walking simulation, full-shift simulation, optimizer behavior, clinical safety scoring, or staffing compliance certification.

## Canonical Fixture Boundary
The documented Trauma One storage correction remains the only canonical floorplan correction in this batch. Issue 438 does not mutate default fixture geometry or promote repaired copies.
