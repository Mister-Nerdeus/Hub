# Issue 598 Closeout

## Summary
- Strengthened runtime seed behavior so same-minute runtime tie-breaking is keyed by task ID and seed, independent of input array order.
- Added a gate and shared test proving a changed runtime seed preserves neutral workload task IDs while changing operational runtime fields, not just hashes or event IDs.

## Files Changed
- packages/shared/src/simulation/nurseTaskProcessingLoop.ts
- packages/shared/src/simulation/ratioAwareQueuePlaceholder.ts
- packages/shared/tests/runtime-seed-behavior.test.mjs
- scripts/check-runtime-seed-behavior.mjs
- scripts/lib/simulation-v0-repair-utils.mjs
- docs/verification/simulation-v0-false-positive-repair-manifest.json
- docs/verification/ISSUE_EVIDENCE_INDEX.json
- docs/verification/issues/issue-598/

## Commands Run
- npm --workspace packages/shared test
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-runtime-seed-behavior.mjs --stage operational-runtime-field-changed --allow-partial --issue 598
- node scripts/check-runtime-seed-behavior.mjs --stage same-workload-preserved --allow-partial --issue 598
- node scripts/check-runtime-seed-behavior.mjs --stage workload-hash-unchanged --allow-partial --issue 598
- node scripts/check-no-phi-fields.mjs

## Tests Passed/Failed
- PASS: packages/shared test, 967 tests.
- PASS: apps/web test, 212 test files.
- PASS: apps/web build.
- PASS: operational-runtime-field-changed, same-workload-preserved, and workload-hash-unchanged gate stages.
- PASS: no-PHI scan.
- FAIL: none.

## Evidence Artifacts
- docs/verification/issues/issue-598/operational-runtime-field-changed-output.json
- docs/verification/issues/issue-598/same-workload-preserved-output.json
- docs/verification/issues/issue-598/workload-hash-unchanged-output.json
- docs/verification/issues/issue-598/no-hidden-randomness-output.txt
- docs/verification/issues/issue-598/no-current-time-dependency-output.txt
- docs/verification/issues/issue-598/test-output/runtime-seed-behavior.txt
- docs/verification/issues/issue-598/test-output/shared.txt
- docs/verification/issues/issue-598/test-output/web.txt
- docs/verification/issues/issue-598/test-output/web-build.txt
- docs/verification/issues/issue-598/no-phi-output.txt

## Known Limitations
- Simulation v0 remains an internal deterministic dry-run only.
- The runtime seed changes synthetic dry-run processing order and timing placeholders only. It does not create full-shift simulation, optimizer behavior, assignment advice, staffing compliance, clinical safety scoring, or patient outcome prediction.
- Manual visual review remains required.
- Promotion remains blocked.
- Full-event simulation, optimization, assignment recommendations, clinical safety scoring, staffing compliance certification, and patient outcome prediction remain out of scope.

## Non-PHI Confirmation
- Non-PHI rules still pass; the issue uses synthetic operational data only and adds no real identity fields, source-system integration, medication names, diagnosis text, clinical notes, access credential disclosure, or forbidden visible wording.

## GO / NO-GO
- GO for next issue.
