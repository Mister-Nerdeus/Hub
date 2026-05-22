# Assumptions Register Contract

The assumptions register is the visible source for deterministic scoring weights, operational task duration defaults, frequency mappings, and seeded simulation defaults.

It is a versioned input contract. It is not persisted to the database in this phase and does not create task generation by itself.

## Shape

```text
AssumptionsRegisterContract
schemaVersion: "1.0.0"
assumptionsId
name
description
createdAt
updatedAt
roomWorkloadWeights
nurseBurdenWeights
taskDurationDefaults
taskFrequencyMappings
simulationDefaults
```

## Current Represented Constants

`packages/shared/fixtures/assumptions-basic.json` represents the current Phase 3 room workload and nurse burden scoring constants:

- Acuity weights: 1, 2, 4, 7, 10.
- Trauma active: 8.
- Isolation active: 3.
- Behavioral risk: 4.
- Fall risk: 2.
- Sitter required: 5.
- High medication frequency: 3.
- High monitoring frequency: 3.
- High procedure burden: 4.
- Room spread per additional occupied room: 2.
- Over target per room: 5.
- Over max per room: 10.
- Trauma mismatch per room: 8.
- Active task, walking, break coverage, and interruption placeholders: 0.

## Validation

- IDs must be non-empty.
- Timestamps must be ISO-compatible.
- Weights must be finite and non-negative.
- Real task durations must be positive.
- Placeholder fields must be explicitly named with `Placeholder`.
- Task frequency mappings must be non-negative integers.
- `defaultShiftLengthMinutes` and `defaultTimestepMinutes` must be positive and evenly divisible.
- `defaultSeed` must be a non-negative safe integer.
- TypeScript and Python validators must agree on valid and invalid fixtures.

## Boundaries

The register does not generate tasks, simulate a shift, assign work to nurses, calculate routes, optimize assignments, or make clinical safety claims.
