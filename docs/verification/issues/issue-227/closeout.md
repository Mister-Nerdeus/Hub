# Issue 227 Closeout

Summary
- Removed committed DOCX source artifacts from repository runtime-visible paths.
- Added boundary guardrails so source manifest paths are private metadata-only.
- Added `.docx` ignore rule and private-source checks into local verification flow.
- Full local verification now includes the private-source gate.

Files Changed
- .gitignore
- .dockerignore
- scripts/check-private-source-artifacts.mjs
- scripts/verify-local.mjs
- packages/shared/fixtures/default-plans/source-layout-manifest.json
- packages/shared/tests/default-plan-source-manifest.test.mjs
- docs/contracts/default-saved-plan-import-contract.md
- docs/project/default-plan-import-status.md
- docs/verification/ISSUE_EVIDENCE_INDEX.json

Commands Run
- Get-ChildItem -Recurse docs/floorplans -Filter *.docx
- rg -n "\.docx|sourceDocumentPath|docs/floorplans" packages/shared/fixtures/default-plans/source-layout-manifest.json packages/shared/tests/default-plan-source-manifest.test.mjs apps/web/src apps/api/app/routes scripts
- Remove-Item docs/floorplans/*.docx -Force
- npm --workspace packages/shared test
- node scripts/check-no-phi-fields.mjs
- node scripts/check-private-source-artifacts.mjs
- node scripts/check-docs-contracts.mjs
- node scripts/verify-local.mjs

Tests Passed / Failed
- `npm --workspace packages/shared test`: passed
- `node scripts/check-no-phi-fields.mjs`: passed
- `node scripts/check-private-source-artifacts.mjs`: passed
- `node scripts/check-docs-contracts.mjs`: passed after evidence and index updates for issue-227
- `node scripts/verify-local.mjs`: passed, including Docker config/build/start, migrations, API smoke proof, shared/web/API tests, web build, no-PHI, docs, and private-source gates

Evidence
- First-failure evidence captured in `first-failure.txt` (pre-change DOCX artifacts visible).
- `private-source-boundary-output.json`: manifests `.docx` removal and private metadata policy guard results.
- `docx-public-repo-negative-output.json`: zero DOCX files remain in web/public and repo floorplan public paths.
- `json-floorplan-only-output.json`: default manifest conversion target remains JSON artifacts only.
- `api-serving-negative-output.json`: API scan contains no DOCX or source document serving references.
- `web-serving-negative-output.json`: web source scan has no DOCX/`docs/floorplans` serving paths.
- `manifest-private-artifact-output.json`: source manifest source-document path policy is now private-only.
- `test-output/verify-local.txt`: complete local-first verification run with Docker smoke evidence.

Known Limitations
- This issue does not alter simulation, route preview, editor integration, or assignment workflows.
- Legacy issue directories (219+ onward) already contain many of the same proof/workflow assertions and remain the implementation basis for later workflow issues.

Non-PHI Confirmation
- `sourceDocumentPath` values in manifest are now null.
- `sourceFilename` values and source metadata remain operational-only strings.
- No DOCX bytes or payloads are exported in floorplan JSON paths.

Next Recommended Issue
- 228
