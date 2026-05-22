# Day Profile Contract

Day profiles describe synthetic operational pressure over a shift. They make typical and slammed day assumptions visible without running a full-shift simulation.

## Shape

```text
DayProfileContract
schemaVersion: "1.0.0"
dayProfileId
name
description
shiftLengthMinutes
segments: DayProfileSegment[]

DayProfileSegment
id
label
startMinute
endMinute
taskVolumeMultiplier
turnoverMultiplier
interruptionMultiplier
walkingCongestionMultiplier
```

## Validation

- Segment IDs must be unique.
- `shiftLengthMinutes` must be positive.
- Segment minutes must be non-negative, increasing, and inside the shift.
- Segments must cover the full shift without gaps or overlaps.
- Multipliers must be finite and positive.
- TypeScript and Python validators must agree.

## Current Fixtures

- `day-profile-typical.json`: moderate synthetic operational pressure.
- `day-profile-slammed.json`: elevated synthetic operational pressure and interruptions.

## Boundaries

Day profiles are operational pressure profiles only. They do not model arrivals, predict outcomes, generate clinical content, run a shift simulation, calculate walking routes, assign tasks, or optimize anything.
