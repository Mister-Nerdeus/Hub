# Issue 875 Closeout

## Problem
Multi-Staff Assignment Overlay Policy

## Code Review
- AssignmentOverlay previously used a target-id Map that retained only one assignment per target; it now groups by target and the validation layer makes restricted multi-staff placement explicit.

## Files Changed
- apps/web/src/features/manual-assignment/AssignmentOverlay.tsx
- apps/web/src/features/manual-assignment/AssignmentBadge.tsx
- packages/shared/src/assignments/manualAssignmentValidation.ts
- packages/shared/tests/manual-assignment-validation-foundation.test.mjs
- docs/project/assignment-foundation-status.md
- scripts/check-multi-staff-assignment-overlay-policy.mjs
- docs/verification/assignment-foundation-manifest.json
- docs/verification/issues/issue-875

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-multi-staff-assignment-overlay-policy.mjs --stage final --issue 875
- node scripts/check-manual-assignment-overlay.mjs --stage final --issue 875
- node scripts/check-manual-assignment-validation.mjs --stage final --issue 875
- node scripts/check-no-phi-fields.mjs
- docker compose config
- docker compose -f docker-compose.production.yml config
- docker compose build web
- docker compose -f docker-compose.production.yml build web

## Tests Passed/Failed
- Required local gates passed.

## Evidence Artifacts
- docs/verification/issues/issue-875/multi-staff-assignment-overlay-policy-output.json
- docs/verification/issues/issue-875/multi-staff-before.json
- docs/verification/issues/issue-875/multi-staff-after.json
- docs/verification/issues/issue-875/co-assignment-policy-proof.json
- docs/verification/issues/issue-875/screenshot-index.json
- docs/verification/issues/issue-875/screenshots
- docs/verification/issues/issue-875/test-output/docker-compose-config.txt
- docs/verification/issues/issue-875/test-output/docker-compose-production-config.txt
- docs/verification/issues/issue-875/test-output/docker-compose-build-web.txt
- docs/verification/issues/issue-875/test-output/docker-compose-production-build-web.txt

## Known Limitations
- The overlay displays a primary label plus count for compact SVG rendering; full labels are preserved in the SVG title.

## Non-PHI Confirmation
- Non-PHI rules still pass for this manual-only assignment foundation task.
