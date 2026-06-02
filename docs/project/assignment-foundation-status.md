# Assignment Foundation Status

The assignment foundation scope is `manual_only`.

Manual assignment foundation may record staff-to-target choices for modeled rooms, split-room bed positions, modeled hall beds, and explicitly assignable support or zone targets.

`bed_position` is the current care-position model for split rooms. A split-room parent remains one physical room and is not emitted as an assignment target; each split-room bed position is emitted as an assignable care-position target.

Multi-staff policy is explicit. Patient-room, hall-bed, and split-bed targets default to one primary manual staff assignment and validation warns when multiple staff are placed on the same target. Explicit support-area and zone targets may show multiple manual staff labels when modeled as assignment targets. The overlay must not collapse additional staff silently; it shows the primary visible label plus a count for additional manual staff on the target.

Assignment target labels, manual staff labels, assignment set labels, and manual assignment notes use a no-overclaim guard so manual assignment artifacts stay operational and do not use recommendation, scoring, optimization, simulation, clinical safety, staffing compliance, or patient outcome language.

The route graph dependency is connectivity-only. It may prove target existence, active floorplan membership, route-node linkage, and missing or disconnected target status.

Recommendations, scoring, optimization, simulation expansion, clinical safety claims, staffing compliance claims, and patient outcome claims remain blocked.
