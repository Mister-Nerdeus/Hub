# Verification Evidence

Local verification evidence is the source of truth for this project stage.

For Issue 187 and later, each issue evidence directory must include:

- `closeout.md`
- `commands.txt`
- `command-output-map.json`
- non-empty command output artifacts mapped from every command
- an entry in `docs/verification/ISSUE_EVIDENCE_INDEX.json`

The docs gate reports the issue number and evidence path for missing or empty artifacts.

## Scaffold

Create a hardened evidence scaffold before starting work:

```sh
node scripts/scaffold-issue-evidence-index-entry.mjs --issue 195 --title "Evidence Index and Local Gate Hardening" --create-files --write
```

The scaffold writes placeholder closeout, command, command-output-map, and docs-gate output files. Replace placeholders with issue-specific evidence before closeout.
