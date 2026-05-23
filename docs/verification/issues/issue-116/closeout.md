# Issue 116 Closeout

## Summary

Added a proof-only simulation run retrieval surface to the web app. It calls the bounded simulation run list endpoint, handles loaded, empty, and structured persisted validation error states, and displays operational limitations without requesting identity fields or adding save, edit, optimizer, export, or production workflow behavior.

## Files Changed

- `apps/web/src/features/simulation/SimulationRunRetrievalProof.tsx`
- `apps/web/src/features/simulation/simulationRunRetrievalApi.ts`
- `apps/web/src/features/simulation/simulationRunRetrievalViewModel.ts`
- `apps/web/src/features/simulation/simulationRunRetrievalViewModel.test.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/styles.css`
- `README.md`
- `scripts/phase-evidence-gates.mjs`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-116/closeout.md`
- `docs/verification/issues/issue-116/commands.txt`
- `docs/verification/issues/issue-116/command-output-map.json`
- `docs/verification/issues/issue-116/screenshots/simulation-retrieval-proof.png`
- `docs/verification/issues/issue-116/test-output/web.txt`

## Commands Run

- `npm --workspace apps/web test > docs/verification/issues/issue-116/test-output/web.txt`
- `npm --workspace apps/web run build | Tee-Object -FilePath docs/verification/issues/issue-116/test-output/web.txt -Append`
- `Push-Location apps/api; python -m pytest | Tee-Object -FilePath ../../docs/verification/issues/issue-116/test-output/web.txt -Append; Pop-Location`
- `docker compose up --build -d | Tee-Object -FilePath docs/verification/issues/issue-116/test-output/web.txt -Append`
- `docker compose build --no-cache api | Tee-Object -FilePath docs/verification/issues/issue-116/test-output/web.txt -Append`
- `docker compose up -d api | Tee-Object -FilePath docs/verification/issues/issue-116/test-output/web.txt -Append`
- `docker compose --profile tools run --rm --build migrate | Tee-Object -FilePath docs/verification/issues/issue-116/test-output/web.txt -Append`
- `& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu --window-size=1280,900 --virtual-time-budget=3000 --screenshot=C:\Projects\Hub\docs\verification\issues\issue-116\screenshots\simulation-retrieval-proof.png http://localhost:5180/#simulation-retrieval-proof`
- `docker compose down | Tee-Object -FilePath docs/verification/issues/issue-116/test-output/web.txt -Append`
- `node scripts/check-no-phi-fields.mjs | Tee-Object -FilePath docs/verification/issues/issue-116/test-output/web.txt -Append`
- `node scripts/check-docs-contracts.mjs | Tee-Object -FilePath docs/verification/issues/issue-116/test-output/web.txt -Append`

## Tests Passed/Failed

- Pre-fix failed: web tests could not compile because no simulation run retrieval view model existed.
- Passed: web tests, including mocked success, empty-list, and structured persisted validation error handling.
- Passed: web build.
- Passed: API test suite.
- Passed: Docker Compose build/start, API image refresh, local migration, and screenshot capture.
- Passed: no-PHI scanner.
- Passed: docs contract gate with Issue 116 command-output map evidence.
- Completed: Docker Compose stack stopped after screenshot capture.

## Evidence Paths

- `docs/verification/issues/issue-116/closeout.md`
- `docs/verification/issues/issue-116/commands.txt`
- `docs/verification/issues/issue-116/command-output-map.json`
- `docs/verification/issues/issue-116/screenshots/simulation-retrieval-proof.png`
- `docs/verification/issues/issue-116/test-output/web.txt`

## Known Limitations

- The retrieval UI is proof-only and displays bounded summaries, not full simulation run editing or export.
- It does not add save/edit UI expansion, optimizer UI changes, PDF/export/download, auth, clinical recommendations, or production workflow claims.

## Non-PHI Confirmation

Non-PHI rules still pass. The UI requests and displays synthetic simulation run summary fields only and does not add PHI, real patient identity, EHR integration, patient records, clinical safety certification language, recommendation language, hidden scoring, optimizer behavior, unseeded randomness, or dependency changes.

## Next Recommended Issue

Batch complete through Issue 116.
