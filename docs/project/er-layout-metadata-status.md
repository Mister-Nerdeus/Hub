# ER Layout Metadata Status

As of Issue 207, `plan-er-pod-phase2` is the canonical metadata-rich ER pod fixture for local validation.

The fixture represents room, zone, hallway, door, station, entry, overflow, and adjacency operational metadata. Special room/door semantics are coherent for trauma, isolation, and behavioral rooms. Entry `linkedPathNodeId` now references the first interior path node instead of self-referencing.

Default saved plan import readiness for this metadata layer is GO. The GO applies only to metadata template readiness; source layout manifest, source mappings, default wrapper contracts, and default plan fixtures remain separate follow-up work.

This status does not claim production readiness, clinical safety, regulatory compliance, PHI support, EHR support, simulation scoring behavior, pathfinding behavior, or optimizer behavior.
