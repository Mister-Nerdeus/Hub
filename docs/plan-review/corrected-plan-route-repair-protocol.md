# Corrected Plan Route Repair Protocol

Batch 311-320 repairs route/path graph blockers only on corrected saved-copy JSON.

## Boundaries

- Do not mutate default source fixtures.
- Do not promote corrected saved copies into default fixtures.
- Do not claim manual visual approval.
- Do not claim exact CAD or exact DOCX parity.
- Do not store private source payload, private source screenshot, source filename, private source path, OCR dump, raw source text, embedded document, PHI, EHR content, real patient data, real staff identifiers, diagnosis text, medication details, or clinical notes.
- Do not add optimizer behavior or new simulation scoring behavior.

## Audit Source

Route readiness must be recomputed from corrected or repaired saved-copy JSON. Prewritten route audit JSON can be used as historical evidence only; it is not trusted as the source of route/export readiness.

## Deterministic Repair Rules

For each corrected saved copy:

1. Build the reviewed plan contract from the saved copy authoring draft and editable layout.
2. Detect rooms missing doors, rooms missing path nodes, dangling edges, invalid edge references, non-finite edge length, non-positive edge length, orphan path nodes, unreachable rooms, blocked required edges, and station-to-room route failures.
3. For every room with a door but no route node, compute a deterministic door point from room geometry, door wall, door offset, and door width.
4. Create a generated/repaired room-door path node tagged with repair metadata and a deterministic `repaired-node-door-{roomId}` id.
5. Find the nearest hallway or station node already connected to the station route graph through unblocked finite positive edges.
6. If no safe target exists, block the plan with `blocked_no_safe_route_target`.
7. Create a generated/repaired edge tagged with repair metadata and deterministic `repaired-edge-{fromNodeId}-to-{toNodeId}` id.
8. Edge length is the Euclidean distance in feet. Display may round; proof retains the internal finite positive value.
9. Mark path sync fresh only when no missing door, missing node, unreachable room, dangling edge, non-finite edge, non-positive edge, or station-to-room route failure remains, and private-source/exact-parity flags are false.
10. Write simulation-ready export only when the repaired copy has fresh path sync and the simulation-ready export contract passes.

## Evidence Limits

The route repair proves graph connectivity and computed route distance only. It is not a manual visual approval, clinical safety certification, exact walking-route truth claim, or promotion authorization.
