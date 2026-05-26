# Issue 291 Code Review Findings

## Fixed

- Evidence-writing shared tests now resolve repository and package paths from `import.meta.url`, not `process.cwd()`, so direct repo-root test execution cannot create stray fixture output.
- `check-floorplan-authoring.mjs` now validates the behavioral manifest for every behavior stage in the 281-290 batch, not only the final gate.

## No Code Change Needed

- Docker compose files already preserve local-first boundaries: local compose uses `Dockerfile.local`, production compose uses production Dockerfiles, host ports remain env-driven, and Postgres is not published as a host port.
- Plans 2-5 source fixture paths were not modified.

## Residual Risk

- The authoring gate still imports shared code from `packages/shared/dist`, matching existing project script behavior. Verification commands build shared before running acceptance gates.
