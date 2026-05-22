# Issue 000B Closeout

## Summary
- Created the standard Codex Issue Template V2 as a Markdown source template.
- Added a GitHub issue form that mirrors the required executable fields.
- Included dependency, non-goal, command, evidence, do-not-close, and closeout response requirements.

## Files Changed
- `docs/codex/codex-issue-template-v2.md`
- `.github/ISSUE_TEMPLATE/codex_issue.yml`
- `docs/verification/issues/issue-000B/commands.txt`
- `docs/verification/issues/issue-000B/closeout.md`

## Commands Run
```text
git status --short --branch
$required = @('Depends On','Non-Goals','Commands Codex Must Run','Required Evidence','Closeout Response Format','Do Not Close Unless'); foreach ($item in $required) { if (-not (Select-String -Path 'docs/codex/codex-issue-template-v2.md' -Pattern ([regex]::Escape($item)) -Quiet)) { throw "Missing $item" } }; 'template fields present'
git diff --check
```

## Tests Passed
- Template required-field check passed for `Depends On`, `Non-Goals`, `Commands Codex Must Run`, `Required Evidence`, `Closeout Response Format`, and `Do Not Close Unless`.
- `git diff --check` passed.

## Tests Failed
- None.

## Evidence Paths
- `docs/verification/issues/issue-000B/closeout.md`
- `docs/verification/issues/issue-000B/commands.txt`

## Known Limitations
- Existing 55 issue bodies were not updated because this repository was empty and contained no issue backlog files to modify.

## Non-PHI Confirmation
- Non-PHI rules still pass by inspection: this issue added only issue-template and verification documentation.

## Next Recommended Issue
- Issue 001, after confirming the 000A/000B guardrails are accepted.
