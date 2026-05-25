# Plan 1 Visual Parity Status

## Current status

- Visual parity contract is now explicit in repository artifacts.
- Plan 1 now includes a Plan 1-wide scaffold coordinate frame and required region blocks.
- Plan 1 now includes all required source-visible room and patient-area objects.
- Source truth coverage is now a machine-checkable requirement for each stage.

## Last completed issue

- Issue 232 (room and patient-area geometry rebuild) complete.

## Current gap summary

- Issue 232 confirms required room IDs are present with approximate source-region placement.
- Current Plan 1 room count is 23; required minimum room count is 23.
- Legacy room markers `room-01` and `space-07` are removed.
- Provider/pharmacy and nurse station modeling remain outstanding for Issue 233.
- Hallway/path/door finalization remains in later issues (233+).

## Planned next milestones

1. Issue 233: stations, hallways, and zones.
2. Issue 234: door/access point coverage.
3. Issue 235: path graph rebuild.
4. Issue 236: walking baseline rebuild.
5. Issue 237: mapping provenance repair.
6. Issue 238: render proof.
7. Issue 239: export integrity.
8. Issue 240: final parity audit and GO/NO-GO.
