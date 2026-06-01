# Issue 858 Closeout

## Problem
Route Graph Directionality Clarification

## Code Review
- Route edges stored endpoints while IDs were already order-independent; the contract now makes undirected connectivity explicit and keeps edge IDs deterministic.

## Files Changed
- packages/shared/src/floorplans/routeEdgeContract.ts
- packages/shared/src/floorplans/deriveRouteGraphFromGeometry.ts
- docs/project/route-graph-connectivity-model.md
- scripts/check-route-graph-directionality.mjs
- docs/verification/issues/issue-858/

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-route-graph-directionality.mjs --stage final --issue 858
- node scripts/check-route-graph-derivation.mjs --stage final --issue 858
- node scripts/check-route-graph-browser-proof.mjs --stage final --issue 858
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-858/route-graph-directionality-output.json
- docs/verification/issues/issue-858/route-edge-before.json
- docs/verification/issues/issue-858/route-edge-after.json
- docs/verification/issues/issue-858/route-graph-directionality-doc-proof.json

## Known Limitations
- Directional movement semantics remain outside this route graph foundation.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI fields, EHR integration, clinical safety claims, staffing compliance claims, patient outcome claims, optimizer, simulation expansion, burden scoring, assignment persistence, or assignment recommendations were added.
