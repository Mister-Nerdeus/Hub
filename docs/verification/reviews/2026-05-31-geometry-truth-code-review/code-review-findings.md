# Geometry Truth Code Review

## Finding 1

Legacy split-room migration returned a split-room contract with `parentRoomId` set to the legacy split bay ID, but it did not return matching parent room geometry. This violated the batch rule that a split room is one physical parent room with two assignable bed positions and conflicted with `validateSplitRoomGeometry`, which requires the parent room to exist.

Resolution:
- `migrateLegacySplitBayToParentBed` now returns `parentRoom` with the migrated split-room result.
- The migrated split room and both bed positions derive their parent IDs from that parent room.
- The web migration wrapper exposes `migratedParentRooms` for callers that need to hydrate parent geometry alongside split-room migrations.
- The legacy migration checker now requires parent room migration coverage.

## Docker Finding

Docker image revision labels still pointed at the prior workspace UX batch. The labels now point to `geometry-truth-repair-765-811`, and Docker documentation records that the geometry truth changes remain inside the existing web/shared build paths with no new services or dependencies.
