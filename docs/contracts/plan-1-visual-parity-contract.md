# Plan 1 Visual Parity Contract

This contract is the source-truth anchor for Plan 1 visual parity work.
It is used as the only upstream authority for deciding whether source-visible labels are
represented, deferred, or still pending.

## Scope

- Plan: `default-er-layout-plan-1`
- Source reference: private visual reference image for Plan 1 (operational-only reference)
- Contract version: `1.0.0`
- Use: layout parity planning, gap reporting, and regression guardrails

## Invariants

- No exact CAD claim.
- No measured walking-truth claim.
- No PHI, patient identity, EHR integration, clinical-safety claim.
- Plan 1 object IDs referenced from fixtures must be stable and explicit.
- Every visible source item must be represented, deferred, or explicitly marked not modeled.

## Required Visible Objects

The following source-visible categories must be represented in parity work:

- Level 1 trauma
- Rooms/areas: 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 20, 21, 22, 23, 24
- Provider/Pharmacy Area
- Left nurse station
- Right nurse station
- Top horizontal hallway
- Left vertical hallway
- EMS entry hallway
- Bottom horizontal hallway
- Right vertical hallway
- Right upper hallway
- Visible access/door ovals
- Grey unlabeled blocks

## Coverage Model

Each visible object entry contains:

- `sourceLabel`: source-visible reference label
- `required`: `true` for required visible source object
- `objectKind`: one of `room`, `zone`, `hallway`, `nurse_station`,
  `door_or_access`, `annotation`, `deferred`
- `expectedTargetId`: expected fixture target ID when represented
- `expectedRegionId`: associated high-level region scaffold ID
- `coverageStatus`: `pending`, `represented`, `deferred`, or `not_modeled_with_reason`
- `notes`: short placement or provenance note

`coverageStatus` `pending` means the item is required but not yet proven represented.

## Minimum Expected Counts

- `rooms`: `23`
- `nurseStations`: `2`
- `providerPharmacyZones`: `1`
- `hallways`: `6`
- `doorsOrAccessPoints`: `18`

## Required Room IDs

The machine-readable source-truth contract must include `requiredRoomIds` for all
source-visible room or patient-area targets:

- `room-level-1-trauma`
- `room-02` through `room-17`, excluding unsupported `room-01` and non-source `room-18`
- `room-19` through `room-24`

## Legacy Fixture Rejections

The visual parity gate must reject the old simplified Plan 1 fixture unless a later
issue documents a specific exception. The rejected old-fixture markers are:

- `room-01`
- `space-07`
- `station-provider-pharmacy`
- old simplified layouts with 8 or fewer rooms
- provider/pharmacy represented only as a nurse station

## Non-Claims

- Not exact CAD geometry.
- Not measured walking truth.
- Not clinical safety certification.
