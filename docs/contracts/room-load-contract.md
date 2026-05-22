# Room Load Contract

Room load is an abstract operational workload input. It describes occupied-room workload categories and never stores patient identity, diagnosis text, clinical notes, or EHR-derived data.

## Enums

- `TaskFrequency`: `none`, `low`, `medium`, `high`, `continuous`.
- `BurdenLevel`: `none`, `low`, `medium`, `high`, `very_high`.
- `TurnoverLevel`: `low`, `normal`, `high`, `surge`.

## RoomLoad

```text
roomId
occupied
acuity: 1 | 2 | 3 | 4 | 5
traumaActive
isolationActive
behavioralRisk
fallRisk
sitterRequired
medicationFrequency
monitoringFrequency
procedureBurden
expectedTurnover
```

## Validation

- `acuity` must be 1 through 5.
- Frequency, burden, and turnover fields must use the explicit enums.
- Old numeric fields such as `acuityScore`, numeric frequency, numeric burden, and `turnoverBurden` are rejected by the current validators.
- When validated with a plan, every room load must reference an existing plan room.
- Room loads are unique by `roomId`.
