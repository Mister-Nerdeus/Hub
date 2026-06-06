# Manual Scenario Foundation Status

The manual scenario foundation scope is `manual_only`.

Manual scenarios may store durable references to a floorplan, a manual staff roster, and a manual assignment set. The manual staff roster is a validated `manual_roster` record containing synthetic manual staff members only. Later issues may add presentation refinements, review workflows, and deterministic metadata without adding recommendations, scoring, optimization, or simulation.

Manual scenario foundation depends on the manual assignment foundation closeout and the split-room unassigned visual-state cleanup. The assignment foundation manifest must allow manual scenario foundation to start, remain `manual_only`, and keep its blocked-boundary flags enabled. The manual scenario manifest must show `splitRoomUnassignedVisualStateStatus: passed` before preflight can pass.

Manual scenario foundation issues 878-889 are complete when the final local GO/NO-GO gate reports `go_for_manual_scenario_review_foundation`.

Co-assignment policy remains part of manual assignment validation. Its `mode` field is the preset, and `allowMultipleForTargetKinds` is the explicit override list for the default single-primary preset. Manual scenarios may reference manual assignment sets, but they do not reinterpret multi-staff placement as assignment quality or route quality.

Scenario artifacts are reference and presentation records only. They do not judge assignment quality, staffing adequacy, route quality, clinical status, or outcome impact.

Final status: manual scenario foundation is ready for the next milestone after local evidence confirms contracts, snapshots, validation, UI, persistence, browser proof, and no-recommendation/no-scoring guard outputs.
