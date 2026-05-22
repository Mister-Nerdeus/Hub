# Nurse Burden Scoring Contract

Nurse burden scoring is deterministic operational scoring for manual assignment proof. It is not a full-shift simulation, route engine, optimizer, or clinical safety certification.

## Formula

```text
nurse burden =
  acuity burden
+ special burden
+ active task minutes
+ walking minutes
+ room spread penalty
+ over-ratio penalty
+ trauma mismatch penalty
+ break coverage penalty
+ interruption penalty
```

## Current Implementation

- Acuity and special burden come from `scoreRoomLoad`.
- Assignment counts and warnings come from `validateManualAssignment`.
- Room spread penalty is 2 points for each occupied assigned room beyond the first.
- Over target penalty is 5 points per occupied room above target.
- Over max penalty is 10 points per occupied room above max.
- Trauma mismatch penalty is 8 points per trauma-active occupied room assigned to a nurse without trauma qualification.

## Explicit Zero Placeholders

These fields are intentionally zero because care-task simulation, walking route scoring, break coverage scoring, and interruption scoring do not exist yet:

- `activeTaskMinutes`
- `walkingMinutes`
- `breakCoveragePenalty`
- `interruptionPenalty`

The output includes the component fields and warnings for each nurse plus the global validation warnings.
