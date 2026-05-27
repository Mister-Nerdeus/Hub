# Canonical Floorplan Corrections

## Issue 432 - Trauma One Storage Correction

The canonical floorplan keeps one product-facing ER pod floorplan. Issue 432 makes the only authorized canonical fixture correction in the 431-440 batch: the room-like box behind Level 1 Trauma is classified as storage.

Before:

- Plan: `default-er-layout-plan-1`
- Object ID: `room-14`
- Label: `14`
- Room type: `standard`
- Coordinates: `x=34`, `y=18`
- Dimensions: `widthFeet=16`, `lengthFeet=14`
- Metadata room class: `standard`
- Adjacent context: rear/upper side of `room-level-1-trauma`

After:

- Plan: `default-er-layout-plan-1`
- Object ID: `room-14`
- Label: `14`
- Room type: `storage`
- Coordinates: `x=34`, `y=18`
- Dimensions: `widthFeet=16`, `lengthFeet=14`
- Metadata room class: `storage`
- Adjacent context: rear/upper side of `room-level-1-trauma`

Reason:

This object is not a patient-care room for future operational room counts, nurse assignments, room-load inputs, ratio math, walking burden scoring, or scenario seed room-load generation. The correction does not promote repaired saved copies, claim manual visual approval, or add simulation behavior.
