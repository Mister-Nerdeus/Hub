# Floorplan Editor Save/Reload Truth Loop Status

Decision: go_for_full_er_floorplan_reconstruction

The prior reconstruction GO remains revoked until this save/reload truth loop is audited. Issue 640 reran/read local validator outputs instead of relying on manifest flags alone.

## Current Scope
- Named working-copy save/reload proof for room movement passed.
- Named working-copy save/reload proof for door changes passed.
- Same saved record reopen proof passed.
- Local recovery draft is separate from named working-copy save.
- Save-status UI separates local draft, named copy, dirty state, active record, and reload proof.

## Remaining Blockers
- None for returning to full ER floorplan reconstruction.

## Out Of Scope
- Collaboration, WebSockets, live sessions, optimizer work, assignment recommendations, clinical safety scoring, staffing compliance, patient outcome prediction, PHI, and EHR integration remain not started.
