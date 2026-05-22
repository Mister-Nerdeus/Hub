# Local Evidence Pack

`npm run evidence:local` creates a local evidence pack for the current repository state.

By default, the command writes transient artifacts under the OS temp directory:

```text
<os-temp>/nerdeus-er-pod-shift-simulator/local-evidence/latest/
```

This default is intended for routine local testing so tracked documentation paths stay clean.

Formal issue closeout can opt into tracked evidence with any of these commands:

```text
npm run evidence:local -- --tracked
npm run evidence:local -- --out docs/verification/local-runs/latest
LOCAL_EVIDENCE_DIR=docs/verification/local-runs/latest npm run evidence:local
```

Output target precedence is:

1. `--out <path>`
2. `LOCAL_EVIDENCE_DIR`
3. `--tracked`
4. OS temp transient default

`--tracked` resolves to `docs/verification/local-runs/latest/`. A custom `--out` or `LOCAL_EVIDENCE_DIR` path writes to the selected path, with repository-local output restricted to `docs/verification/local-runs/`.

The pack includes configured ports, Docker Compose config, Docker stack startup, Docker service status, migration output, Docker plan API smoke output, no-PHI output, docs-contract output, shared tests, web tests, API tests, web build, and Phase 2 plan validation output.

The generated `manifest.json` lists every artifact in the pack and includes `createdAt`, `apiHostPort`, `webHostPort`, `outputMode`, `outputDir`, `artifacts`, and `status`.

The command is local-only and does not require GitHub Actions or external artifact upload.
