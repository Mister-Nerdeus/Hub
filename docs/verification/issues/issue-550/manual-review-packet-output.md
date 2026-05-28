# Canonical Map Manual Review Packet

## Reference Image And Source Record

- Canonical floorplan: `default-er-layout-plan-1`
- Stable reference image: `docs/verification/reference/plan-1-reference-floorplan.png`
- Source record: `docs/verification/reference/plan-1-reference-source-record.json`
- Source image checksum: `BCCF0F44DDB89BB2C74D3D7C40D669EF8B1DC90A048CE65242339DC88ED9F6BC`

## Overlay Trace Asset

- Overlay: `docs/verification/reference/plan-1-reference-overlay.json`
- Overlay notes: `docs/verification/reference/plan-1-reference-overlay-notes.md`
- Coordinate space: normalized image bounds.

## App Rendered Canonical Map Screenshot

- Full app-rendered proof: `docs/verification/issues/issue-543/screenshots/app-rendered-canonical-floorplan.png`
- Reference source image proof: `docs/verification/issues/issue-543/screenshots/reference-floorplan-source.png`

## Region Screenshots

- Left pod: `docs/verification/issues/issue-543/screenshots/parity-left-trauma-pod.png`
- Right pod: `docs/verification/issues/issue-543/screenshots/parity-right-pod.png`
- Bottom bank: `docs/verification/issues/issue-543/screenshots/parity-bottom-bank.png`
- Support area: `docs/verification/issues/issue-543/screenshots/parity-support-area.png`

## Geometry Diff Summary

No fixture geometry was mutated in Issues 541-549. This packet uses the committed reference image, overlay, selector bridge, and generated proof artifacts.

## Scale Contract Summary

The 10 ft x 10 ft base room module remains the scale reference for standard rooms. The reference image is an operational visual reference, not a CAD source.

## Room Bed Bay Count Summary

- Physical rooms: 18
- Bed positions: 22
- Split bays: 4
- Ordinary patient rooms: 14
- Assignment eligible bed positions: 22
- Ratio eligible bed positions: 22

## Storage Support Exclusion Summary

- Storage: 1
- Support areas: 3
- Hallways/corridors: 7
- Excluded spaces: 11
- Storage remains non-patient, non-assignable, excluded from ratio math, and excluded from room-load generation.

## Known Limitations

- Manual visual review remains required.
- Manual approval is not claimed.
- Exact CAD or architectural parity is not claimed.
- Promotion remains blocked.
- Scenario seed work remains contract-only until Issue 550 records GO.
