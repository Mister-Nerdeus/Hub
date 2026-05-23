# Issue Evidence Output Contract

From Issue 104 onward, every issue folder must include at least one captured, non-empty output artifact. `commands.txt` and `closeout.md` are required, but they do not prove command output by themselves.

## Rule

Issues `104` and later require one or more non-empty files matching these patterns:

- `test-output/*.txt`
- `api-responses/*.json`
- `sample-json/*.json`
- `screenshots/*.png`

Issues `001` through `103` are grandfathered unless a later issue explicitly indexes their evidence output.

## Gate Output

```json
{
  "issue": "104",
  "requiresCapturedOutputFromIssue": 104,
  "allowedEvidenceOutputPatterns": [
    "test-output/*.txt",
    "api-responses/*.json",
    "sample-json/*.json",
    "screenshots/*.png"
  ],
  "grandfatheredIssues": "001-103"
}
```

## Local Verification

Run:

```text
node scripts/check-issue-command-output.mjs
node scripts/check-evidence-index-output-consistency.mjs
node scripts/check-docs-contracts.mjs
```

The standalone checker includes self-tests for command-only issue folders, empty output artifacts, non-empty output artifacts, and grandfathered older issues.

From Issue 112 onward, every output path referenced by `command-output-map.json` must also be listed in `docs/verification/ISSUE_EVIDENCE_INDEX.json`. This keeps captured command output reviewable from the issue evidence index instead of only from each issue folder.
