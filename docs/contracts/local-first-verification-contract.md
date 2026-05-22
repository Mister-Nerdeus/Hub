# Local-First Verification Contract

Local verification artifacts are the required closeout proof for this project stage.

## Authority

- Local Docker/runtime proof is authoritative.
- GitHub Actions may exist, but Codex must not add, expand, or rely on GitHub Actions unless the user explicitly asks.
- Phase 3 work remains blocked until local verification passes from a stopped Docker state.
- The local verifier must run `docker compose up --build -d` before migrations and API smoke proof.
- The local verifier must run `docker compose ps` after startup.

## Required Local Proof

Every issue must include `commands.txt` and `closeout.md` under its issue evidence folder. Local proof must include command evidence for the checks relevant to the issue, and the full local verifier must include:

- Docker Compose config validation.
- Docker stack startup from the verifier.
- Docker service status after startup.
- Docker migration.
- Docker plan API smoke proof.
- no-PHI scan.
- docs contract check.
- shared package tests.
- web tests.
- API tests.
- web build.

## Evidence Packs

`npm run evidence:local` generates a local evidence pack and writes a manifest that lists the generated artifacts. The default output mode is transient and writes outside tracked repository paths under the OS temp directory.

Tracked evidence is opt-in for formal closeout:

```text
npm run evidence:local -- --tracked
npm run evidence:local -- --out docs/verification/local-runs/latest
LOCAL_EVIDENCE_DIR=docs/verification/local-runs/latest npm run evidence:local
```

Evidence output target precedence is `--out <path>`, then `LOCAL_EVIDENCE_DIR`, then `--tracked`, then the OS temp transient default. `--tracked` resolves to `docs/verification/local-runs/latest/`; repository-local custom output must stay under `docs/verification/local-runs/`.

The manifest must include `createdAt`, `apiHostPort`, `webHostPort`, `outputMode`, `outputDir`, `artifacts`, and `status`. The evidence pack command is local-only and must not upload artifacts externally.

## Boundaries

- Do not modify `.github/workflows/*` for local-first closeout proof.
- Do not use remote checks as a closeout gate unless the user explicitly asks.
- Do not add PHI fields, clinical safety claims, EHR integration, hidden scoring, or optimizer behavior.
- Keep local runtime ports env-driven through `API_HOST_PORT` and `WEB_HOST_PORT`.
- Do not publish the Postgres host port for normal local verification.
