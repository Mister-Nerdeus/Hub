# Command Output Map Contract

From Issue 112 onward, each issue folder must include `command-output-map.json`.

## Rule

Every non-empty command listed in `commands.txt` must appear exactly in the map and must reference at least one non-empty output artifact under the same issue evidence folder. Extra output artifacts may exist, but they do not replace mappings for every command.

Issues `001` through `111` are grandfathered.

## Shape

```json
{
  "issue": "112",
  "commands": [
    {
      "command": "node scripts/check-command-output-map.mjs | Tee-Object -FilePath docs/verification/issues/issue-112/test-output/command-output-map.txt",
      "outputs": [
        "docs/verification/issues/issue-112/test-output/command-output-map.txt"
      ]
    }
  ]
}
```

## Local Verification

Run:

```text
node scripts/check-command-output-map.mjs
node scripts/check-docs-contracts.mjs
```

The standalone checker includes self-tests for missing maps, missing command mappings, missing mapped output, empty mapped output, valid mappings, and grandfathered older issues.
