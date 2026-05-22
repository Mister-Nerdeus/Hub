# Assumptions-Driven Scoring Contract

Phase 5 keeps the existing Phase 3 default scoring APIs and adds assumptions-driven scoring APIs for contexts that have an assumptions register.

## Public APIs

- `scoreRoomLoad(roomLoad)` remains the default deterministic scorer.
- `scoreNurseBurden(plan, roomLoads, assignmentSet)` remains the default deterministic scorer.
- `scoreRoomLoadWithAssumptions(roomLoad, assumptions)` scores with visible `roomWorkloadWeights`.
- `scoreNurseBurdenWithAssumptions(plan, roomLoads, assignmentSet, assumptions)` scores with visible room and nurse burden weights.
- `assertDefaultScoringAssumptionParity(assumptions)` verifies that default exported constants match the assumptions register.

## Invariants

- `assumptions-basic.json` must match the exported default scoring constants.
- Default scoring output must remain unchanged.
- Assumptions-driven scoring must match default scoring when using `assumptions-basic.json`.
- Changing an assumptions weight changes only assumptions-driven scoring.
- Parity failure must name the mismatched weight path.
- Weights stay visible in the assumptions register.

## Boundaries

This contract does not add simulation, optimization, generated task assignment, walking routes, delay calculation, hidden scoring, PHI, patient identity, EHR integration, or clinical safety certification claims.
