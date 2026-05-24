# Path Graph Walking Truth Contract

This contract defines the current readiness checks for default ER layout path graphs.

## What Coverage Proves

- Door, room, station, entry, and hallway path-node references resolve to the expected object types.
- Every default plan has required operational path nodes for rooms, doors, stations, entries, and hallways.
- Every path edge references existing path nodes.
- Required operational nodes are connected through one usable, unblocked graph component.
- Blocked edges are counted and excluded from usable connectivity checks.

## What Coverage Does Not Prove

- It does not prove measured walking distance.
- It does not prove exact source DOCX geometry.
- It does not certify operational adequacy.
- It does not add nurse assignment scoring, route recommendations, optimizer behavior, simulation changes, API routes, or database seeding.

## Default Plan Readiness

All five default plans must pass:

- `auditDefaultPlanPathNodeCoverage(plan)`
- `auditDefaultPlanPathEdgeCoverage(plan)`
- route preview contract validation
- walking baseline contract validation
- no-PHI and docs gates

The graph is considered ready for future nurse assignment burden preview work only as an approximate, auditable fixture graph.
