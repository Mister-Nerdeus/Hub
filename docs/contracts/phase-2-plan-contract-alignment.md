# Phase 2 Plan Contract Alignment

The Phase 2 plan contract is aligned to the source plan before Phase 3 nurse assignment and scoring work begins.

## Naming

The contract uses explicit domain names:

- `roomType` for room category.
- `zoneType` for zone category.
- `nodeType` for walking graph node category.

Generic `type` fields are not accepted in plan JSON.

## Required Plan Metadata

- `description`: optional operational description, max 500 characters when present.
- `createdAt`: ISO-compatible timestamp.
- `updatedAt`: ISO-compatible timestamp.

## Required Room Fields

- `roomType`
- `maxPatients`
- `traumaCapable`
- `isolationCapable`
- `doorPoint`

These fields are operational layout attributes only. They are not patient identity, diagnosis, clinical note, or EHR fields.

## Required Nurse Station Fields

`stationType` must be one of:

- `primary`
- `secondary`
- `charge`
- `temporary`

## Required Zone Travel Fields

- `travelBlocked`
- `travelPenalty`

Travel fields are layout graph hints for future operational walking-distance logic. They are not scoring, simulation, or optimization.

## Length Limits

- `planId`: 64 characters max.
- `name`: 160 characters max.
- `description`: 500 characters max.

These limits match the current database constraints and must be enforced before database writes.
