# Issue 743 Closeout

## Problem
Workspace UX GO/NO-GO Audit

## Code Review
- Reviewed final audit failures and fixed stale local validators that still asserted the pre-Milestone-A selector/hub/test contracts.
- Updated production Docker image revision labels to the Workspace UX Foundation batch and aligned the Docker runtime checker.

## Summary
- Local validator status: passed.
- `workspaceUxGoNoGoStatus` is `go_for_durable_assignment_foundation`.

## Files Changed
- apps/api/Dockerfile.production
- apps/web/Dockerfile.production
- apps/web/src/features/layout-editor/__tests__/editorViewportLayout.test.tsx
- apps/web/src/features/layout-editor/layoutInspectorViewModel.test.ts
- scripts/check-active-floorplan-hub.mjs
- scripts/check-active-floorplan-selector-ux.mjs
- scripts/check-active-floorplan-workflow-go-no-go.mjs
- scripts/check-production-docker-runtime.mjs
- scripts/check-workspace-ux-go-no-go.mjs
- scripts/check-workspace-ux-preflight.mjs
- docs/verification/workspace-ux-foundation-manifest.json
- docs/verification/active-floorplan-workflow-manifest.json
- docs/verification/issues/issue-743/

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- npm run check:clean-committed-state
- node scripts/check-workspace-ux-preflight.mjs --stage final --issue 743
- node scripts/check-full-page-workspace-shell.mjs --stage final --issue 743
- node scripts/check-product-shell-rail.mjs --stage final --issue 743
- node scripts/check-product-workflow-stepper.mjs --stage final --issue 743
- node scripts/check-route-step-mapping.mjs --stage final --issue 743
- node scripts/check-runtime-proof-advanced-only.mjs --stage final --issue 743
- node scripts/check-future-tools-hidden-normal-mode.mjs --stage final --issue 743
- node scripts/check-active-floorplan-hub.mjs --stage final --issue 743
- node scripts/check-editor-workspace-layout.mjs --stage final --issue 743
- node scripts/check-editor-normal-toolbar-ux.mjs --stage final --issue 743
- node scripts/check-editor-detailed-tools-advanced.mjs --stage final --issue 743
- node scripts/check-editor-details-bottom-panel.mjs --stage final --issue 743
- node scripts/check-normal-mode-technical-copy.mjs --stage final --issue 743
- node scripts/check-active-floorplan-workflow-go-no-go.mjs --stage final --issue 743
- node scripts/check-door-authoring-browser-regression.mjs --stage final --issue 743
- node scripts/check-split-room-browser-regression.mjs --stage final --issue 743
- node scripts/check-no-phi-fields.mjs
- node scripts/check-workspace-ux-go-no-go.mjs --stage final --issue 743
- node scripts/check-production-docker-runtime.mjs

## Tests Passed/Failed
- Passed: shared tests, web tests, web build, final Workspace UX validators, active-floorplan go/no-go, door browser regression, split-room browser regression, no-PHI scan, and production Docker runtime label check.
- Failed then fixed: web tests had stale layout-inspector and viewport expectations; active-floorplan hub/selector validators had stale source assertions.

## Evidence Artifacts
- docs/verification/issues/issue-743/test-output/shared.txt
- docs/verification/issues/issue-743/test-output/web.txt
- docs/verification/issues/issue-743/test-output/web-build.txt
- docs/verification/issues/issue-743/test-output/workspace-ux-go-no-go-final.txt
- docs/verification/issues/issue-743/test-output/door-authoring-browser-regression.txt
- docs/verification/issues/issue-743/test-output/split-room-browser-regression.txt
- docs/verification/issues/issue-743/manifest-update-output.json
- docs/verification/issues/issue-743/docker-runtime-output.json
- docs/verification/issues/issue-743/closeout.md

## Known Limitations
- Final documentation/root-script/screenshot-index/no-overclaim closeout issues still follow in this batch.
- Issue 743 does not implement durable assignment sets, nurse profiles, room loads, scoring, simulation, optimizer, or reports.

## Non-PHI Confirmation
- Non-PHI rules still pass. Evidence: docs/verification/issues/issue-743/no-phi-output.txt.
