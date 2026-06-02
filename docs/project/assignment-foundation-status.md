# Assignment Foundation Status

The assignment foundation scope is `manual_only`.

Manual assignment foundation may record staff-to-target choices for modeled rooms, split-room bed positions, modeled hall beds, and explicitly assignable support or zone targets.

`bed_position` is the current care-position model for split rooms. A split-room parent remains one physical room and is not emitted as an assignment target; each split-room bed position is emitted as an assignable care-position target.

The route graph dependency is connectivity-only. It may prove target existence, active floorplan membership, route-node linkage, and missing or disconnected target status.

Recommendations, scoring, optimization, simulation expansion, clinical safety claims, staffing compliance claims, and patient outcome claims remain blocked.
