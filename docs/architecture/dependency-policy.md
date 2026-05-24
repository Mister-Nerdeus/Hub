# Dependency Policy

## Pinning

Workspace `package.json` dependency specs must be exact versions. Do not use `latest`, wildcard, range, caret, or tilde specs for `dependencies`, `devDependencies`, `optionalDependencies`, or `peerDependencies`.

The local gate is:

```sh
node scripts/check-dependency-specs.mjs
```

This gate is part of `node scripts/verify-local.mjs`.

## Runtime Versions

- Node.js: repository manifests require Node `>=22`; local verification currently runs on Node 22 or newer.
- Python: API verification runs with the local Python interpreter used by `cd apps/api && python -m pytest`.
- Postgres: local Docker verification uses the Postgres image declared by `docker-compose.yml`.

## Dependency Additions

Major dependency additions require an update to `docs/architecture/dependency-decision-matrix.md` before closeout. The decision record must describe the area, decision, reason, and issue that added the dependency.

Lockfile updates must be produced locally and committed with the manifest change.
