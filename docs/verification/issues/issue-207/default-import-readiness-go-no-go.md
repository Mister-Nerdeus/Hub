# Issue 207 Default Import Readiness GO/NO-GO

Status: GO for metadata template readiness.

Rationale:

- Canonical fixture special room and door metadata now align for trauma, isolation, and behavioral rooms.
- Entry `linkedPathNodeId` references `node-hall-west` instead of self-referencing `node-ems-entry`.
- TypeScript and Python validators reject the repaired mismatch classes.
- This GO is limited to default saved plan import foundation metadata. It does not approve source document conversion, database seeding, UI picking, pathfinding changes, simulation changes, or optimizer changes.
