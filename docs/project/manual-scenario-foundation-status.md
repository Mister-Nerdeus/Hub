# Manual Scenario Foundation Status

The manual scenario foundation scope is `manual_only`.

Manual scenarios may store durable references to a floorplan, a manual staff roster, and a manual assignment set. Later issues may add reference snapshots, version metadata, scenario labels, scenario notes, display settings, validation status, and deterministic timestamps.

Manual scenario foundation depends on the manual assignment foundation closeout. The assignment foundation manifest must allow manual scenario foundation to start, remain `manual_only`, and keep its blocked-boundary flags enabled.

Manual scenario foundation is preflight only until issues 879-887 complete. The final GO/NO-GO gate remains `not_ready`.

Co-assignment policy remains part of manual assignment validation. Manual scenarios may reference manual assignment sets, but they do not reinterpret multi-staff placement as assignment quality or route quality.

Scenario artifacts are reference and presentation records only. They do not judge assignment quality, staffing adequacy, route quality, clinical status, or outcome impact.
