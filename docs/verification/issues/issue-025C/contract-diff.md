# Issue 025C Contract Diff

## Added Plan Metadata
- `description?: string | null`
- `createdAt: string`
- `updatedAt: string`

## Renamed Generic Fields
- `Room.type` became `Room.roomType`
- `Zone.type` became `Zone.zoneType`
- `PathNode.type` became `PathNode.nodeType`

## Added Room Fields
- `maxPatients`
- `traumaCapable`
- `isolationCapable`
- `doorPoint?: Point | null`

## Added Station and Zone Fields
- `NurseStation.stationType`
- `Zone.travelBlocked`
- `Zone.travelPenalty?: number | null`

## Validation Updates
- TypeScript and Python reject missing source-plan fields.
- TypeScript and Python reject bad station types and bad zone travel penalties.
- Updated fixtures and Phase 2 evidence JSON validate against the aligned contract.
