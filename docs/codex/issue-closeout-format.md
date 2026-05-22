# Issue Closeout Format

Every issue closeout must be written to `docs/verification/issues/issue-XXX/closeout.md` and mirrored in the final Codex response.

````markdown
# Issue XXX Closeout

## Summary
- What changed.

## Files Changed
- Exact paths.

## Commands Run
```text
command
```

## Tests Passed
- Passing tests and checks.

## Tests Failed
- Failing tests, or `None`.

## Evidence Paths
- `docs/verification/issues/issue-XXX/closeout.md`
- Additional screenshots, API responses, sample JSON, or test output.

## Known Limitations
- Remaining limitations, or `None`.

## Non-PHI Confirmation
- Confirm whether non-PHI rules still pass.

## Next Recommended Issue
- Issue ID and reason.
````

If a required command cannot run because the relevant app, script, or dependency does not exist yet, record the command and the concrete blocker.
