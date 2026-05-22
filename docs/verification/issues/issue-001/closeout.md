# Issue 001 Closeout

## Summary
- Added the project charter that defines the simulator as an operational simulation tool only.
- Captured non-goals for PHI, real identity, EHR integration, safety certification language, patient outcome prediction, hidden scoring, and premature optimization.

## Files Changed
- `README.md`
- `docs/project/project-charter.md`

## Commands Run
```text
node scripts/check-no-phi-fields.mjs
node scripts/check-docs-contracts.mjs
git diff --check
```

## Tests Passed
- Non-PHI scanner passed.
- Docs contract check passed after all closeout artifacts were present.
- Whitespace check passed.

## Tests Failed
- None.

## Evidence Paths
- `docs/verification/issues/issue-001/closeout.md`

## Known Limitations
- This issue establishes the charter only; it does not build plan editing, scoring, simulation, optimization, or reports.

## Non-PHI Confirmation
- Non-PHI rules pass by scanner and inspection.

## Next Recommended Issue
- Issue 002.
