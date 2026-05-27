# Issue 439 Closeout - Legacy Invalid Layout Quarantine + Visual DOM Proof

## Result
GO for Issue 440.

Legacy layout validation now quarantines invalid storage and solid-wall states with explicit messages. Browser-rendered proof exists for the canonical Trauma One storage object and a synthetic solid-wall proof object, with DOM assertions showing gray rendering, legend visibility, zero solid-wall door markers, zero nurse-color overlays, no exact parity claim, no PHI-like text, and no simulation output.

## Files Changed
- `packages/shared/src/floorplans/legacyLayoutValidation.ts`
- `packages/shared/src/index.ts`
- `packages/shared/tests/legacy-layout-storage-solid-wall.test.mjs`
- `apps/web/tests/storage-solid-wall-visual-proof.spec.ts`
- `scripts/capture-storage-solid-wall-visual-proof.mjs`
- `scripts/check-room-type-semantics.mjs`
- `docs/verification/storage-solid-wall-dom-assertions.json`
- `docs/verification/room-type-semantics-manifest.json`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-439/*`

## Commands Run
- `npm --workspace packages/shared test`
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/capture-storage-solid-wall-visual-proof.mjs --issue 439`
- `node scripts/check-room-type-semantics.mjs --stage legacy-invalid-layouts --allow-partial --issue 439`
- `node scripts/check-room-type-semantics.mjs --stage visual-dom-proof --allow-partial --issue 439`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 439`

## Tests Passed / Failed
- Passed: shared package tests.
- Passed: web tests.
- Passed: web production build.
- Passed: Issue 439 legacy invalid-layout gate.
- Passed: Issue 439 visual DOM proof gate.
- Passed: no-PHI scan.
- Passed: default plans 2 through 5 unchanged gate.
- Initial failure recorded in `first-failure.txt`: browser proof script regex was over-escaped and was corrected before closeout.

## Evidence Artifacts
- `legacy-invalid-layout-validation-output.json`
- `solid-wall-door-quarantine-output.json`
- `solid-wall-path-node-quarantine-output.json`
- `storage-room-load-quarantine-output.json`
- `storage-assignment-quarantine-output.json`
- `visual-proof-output.json`
- `storage-dom-output.json`
- `solid-wall-dom-output.json`
- `gray-rendering-output.json`
- `legend-output.json`
- `no-door-marker-output.json`
- `no-assignment-overlay-output.json`
- `screenshots/storage-solid-wall-visual-proof.png`
- `screenshots/trauma-storage-proof.png`
- `docs/verification/storage-solid-wall-dom-assertions.json`

## Known Limitations
- The solid-wall visual object is synthetic browser-proof state only; it is not promoted into canonical defaults.
- Browser proof is not manual visual approval and does not claim exact CAD/source parity.

## Non-PHI Confirmation
The no-PHI gate passed. This issue added no PHI, no EHR data, no real patient identity, no real nurse names, no employee IDs, no real hospital identifiers, no medication names, no diagnosis text, and no clinical notes.
