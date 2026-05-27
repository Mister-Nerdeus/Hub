# Storage / Solid-Wall Semantics Status

## Status
GO for One-Floorplan Scenario Seed + Ratio Comparison Foundation.

## Scope
The ER Pod Shift Simulator remains a single-canonical-floorplan operational simulation tool. Storage and solid-wall semantics now layer onto the canonical floorplan without creating a multi-floorplan product path.

## Completed Semantics
- Storage and solid_wall are explicit room-type semantics.
- The documented Trauma One rear box is classified as storage.
- Storage and solid wall render with muted gray presentation rules.
- Solid walls reject doors and room-door path-node creation.
- Storage and solid walls are excluded from nurse assignment, capacity/ratio math, room-load inputs, burden scoring, and patient-care routing/scoring destinations.
- Invalid legacy states are quarantined with explicit validation messages.
- Browser-rendered DOM proof exists in `docs/verification/storage-solid-wall-dom-assertions.json`.

## Boundaries Still Enforced
- No promotion is approved.
- Manual review remains required.
- No optimizer behavior was added.
- No full-shift simulation behavior was added.
- No 4:1 / 3:1 scenario execution was added.
- No ER activity preset execution was added.
- No clinical safety scoring or staffing compliance certification was added.
- No PHI, EHR data, real identity data, medication names, diagnosis text, or clinical notes were introduced.

## Known Gaps
Future scenario-seed and ratio-comparison work can now consume the room-type semantics, but that work has not started in this batch.
