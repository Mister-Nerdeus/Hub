# Issue 859 Closeout

## Problem
Perimeter Wall Warning Marker Fix

## Code Review
- Perimeter-wall warnings previously resolved through a room-node lookup path. The overlay now renders perimeter-wall warning anchors directly, and derivation emits stable wall anchors for blocked wall warnings.

## Files Changed
- apps/web/src/features/layout-editor/RouteGraphOverlay.tsx
- packages/shared/src/floorplans/routeGraphContract.ts
- packages/shared/src/floorplans/deriveRouteGraphFromGeometry.ts
- scripts/check-perimeter-wall-warning-marker.mjs
- docs/verification/issues/issue-859/

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-perimeter-wall-warning-marker.mjs --stage final --issue 859
- node scripts/check-route-graph-overlay.mjs --stage final --issue 859
- node scripts/check-route-graph-browser-proof.mjs --stage final --issue 859
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-859/perimeter-wall-warning-marker-output.json
- docs/verification/issues/issue-859/wall-warning-before.json
- docs/verification/issues/issue-859/wall-warning-after.json
- docs/verification/issues/issue-859/screenshot-index.json
- docs/verification/issues/issue-859/screenshots/

## Known Limitations
- Wall warning markers are visual warning anchors only; wall nodes are not added.

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI fields, EHR integration, clinical safety claims, staffing compliance claims, patient outcome claims, optimizer, simulation expansion, burden scoring, assignment persistence, or assignment recommendations were added.
