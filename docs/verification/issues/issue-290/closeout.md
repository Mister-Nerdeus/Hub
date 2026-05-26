# Issue 290 Closeout

## Summary
GO to begin DOCX/source-driven default plan correction. Issue 290 audited Issues 281-289 and hardened `node scripts/check-floorplan-authoring.mjs --stage final` so the no-allowance final gate defaults to Issue 290 evidence instead of the prior Issue 280 audit.

## Files Changed
- `scripts/check-floorplan-authoring.mjs`
- `docs/project/floorplan-authoring-status.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-290/`

## Commands Run
- `npm --workspace packages/shared test`
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-no-phi-fields.mjs`
- `node scripts/check-docs-contracts.mjs`
- `node scripts/check-private-source-artifacts.mjs`
- `node scripts/check-floorplan-authoring.mjs --stage final`
- `node scripts/check-plan-1-visual-parity.mjs --stage final --issue 290`
- `node scripts/check-plan-1-assignment-workflow.mjs --stage final --issue 290`
- `node scripts/check-plan-1-scenario-simulation.mjs --stage final --issue 290`
- `node scripts/check-plan-1-simulation-refinement.mjs --stage final --issue 290`
- `node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 290`
- `docker compose down`
- `node scripts/verify-local.mjs`

## Tests Passed/Failed
Passed:
- Shared package tests.
- Web tests.
- Web production build.
- No-PHI gate.
- Docs contracts gate.
- Private source artifacts gate.
- Floorplan authoring final gate without allowance flags.
- Plan 1 visual parity final gate.
- Plan 1 assignment workflow final gate.
- Plan 1 scenario simulation final gate.
- Plan 1 simulation refinement final gate.
- Plans 2-5 unchanged gate.
- Full local verifier, including Docker compose config/build/start, migrations, API smoke proof, API tests, shared tests, web tests, web build, no-PHI, docs, dependency specs, simulation parity, and private-source checks.

Failed first by design:
- `node scripts/check-floorplan-authoring.mjs --stage final` failed before audit artifacts existed.

## Evidence Artifacts
- `docs/verification/issues/issue-290/authoring-behavioral-audit.md`
- `docs/verification/issues/issue-290/authoring-gate-execution-summary.json`
- `docs/verification/issues/issue-290/save-reload-e2e-summary.json`
- `docs/verification/issues/issue-290/room-authoring-e2e-summary.json`
- `docs/verification/issues/issue-290/door-authoring-e2e-summary.json`
- `docs/verification/issues/issue-290/hallway-v2-summary.json`
- `docs/verification/issues/issue-290/path-sync-audit-summary.json`
- `docs/verification/issues/issue-290/door-path-node-generation-summary.json`
- `docs/verification/issues/issue-290/simulation-ready-export-summary.json`
- `docs/verification/issues/issue-290/plan-2-dry-run-summary.json`
- `docs/verification/issues/issue-290/no-docx-source-exposure-summary.json`
- `docs/verification/issues/issue-290/source-fixture-nonmutation-summary.json`
- `docs/verification/issues/issue-290/go-no-go.md`
- `docs/verification/issues/issue-290/test-output/`

## GO / NO-GO
GO to begin DOCX/source-driven default plan correction.

## Authoring Behaviors Audited
Save/reload, Save As reload, room resize/type/add, door add/move/delete/reassign, hallway V2 generation, path-sync audit, door-to-path-node generation, simulation-ready export validation/blocking, and Plan 2 saved-copy dry run.

## Source Fixture Nonmutation
Plans 2-5 protected source fixtures remain unchanged. Issue 289 also proved Plan 2 dry-run edits stayed on an editable saved copy.

## Private Source Boundary
DOCX/source files are not exposed as runtime/public assets. Saved drafts store safe provenance metadata only and no private source payload.

## Known Limitations
- Plan 2 dry run is synthetic/manual authoring only and does not claim exact DOCX parity.
- Generated hallway and pod border geometry remain approximate operational authoring aids, not CAD geometry.
- Door-to-path-node generation is a deterministic prototype and still requires manual review when hallway connection is incomplete.
- Simulation-ready export blocks stale or incomplete route access instead of auto-fixing it.

## Non-PHI Confirmation
Non-PHI rules still pass. The batch does not add PHI, EHR data, real patient data, real nurse names, employee IDs, real hospital identifiers, medication names, diagnosis text, clinical notes, optimizer behavior, hidden scoring behavior, or clinical safety certification language.

## Next Recommended Issue
Begin DOCX/source-driven default plan correction under the saved-copy-first workflow and keep source fixture mutations behind explicit correction issues with local evidence.
