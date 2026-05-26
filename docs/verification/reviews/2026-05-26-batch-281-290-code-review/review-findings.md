# Batch 281-290 Code Review

## Finding

High severity: `scripts/check-floorplan-authoring.mjs --stage final` could pass from existing Issue 290 evidence files without validating their contents, and its console output did not prove that behavioral execution ran. This weakened the batch requirement that final gate output prove behavior rather than merely file presence.

## Fix

The final authoring gate now:

- Executes the Plan 1 behavioral harness on `--stage final`.
- Prints a behavioral proof summary to stdout so captured gate output proves execution.
- Validates Issue 290 audit summary content for save/reload, room authoring, door authoring, hallway V2, path sync audit, door/path-node generation, simulation-ready export, Plan 2 dry run, no DOCX exposure, and source fixture nonmutation.
- Fails when required audit summaries are missing, malformed, stale, or inconsistent.

## Residual Risk

The final audit still relies on local evidence artifacts from Issues 281-289 as the source of truth. That matches the project stage contract, but future source-driven correction should keep explicit issue-scoped evidence rather than relying on remote checks.
