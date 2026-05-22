# Local Evidence Pack

`npm run evidence:local` creates a local evidence pack for the current repository state.

The command writes artifacts to:

```text
docs/verification/local-runs/latest/
```

The pack includes configured ports, Docker Compose config, Docker stack startup, Docker service status, migration output, Docker plan API smoke output, no-PHI output, docs-contract output, shared tests, web tests, API tests, web build, and Phase 2 plan validation output.

The generated `manifest.json` lists every artifact in the pack. For Issue 028, the same manifest is also copied to:

```text
docs/verification/issues/issue-028/local-evidence-manifest.json
```

The command is local-only and does not require GitHub Actions or external artifact upload.
