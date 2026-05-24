# Default Plan Import Status

Status: GO for the next path graph and walking-truth batch.

The five default ER layout fixtures are registered, mapped, wrapped as read-only default plan records, and validated through local TypeScript contract tests.

## Fixture Coverage

- `default-er-layout-plan-1`
- `default-er-layout-plan-2`
- `default-er-layout-plan-3`
- `default-er-layout-plan-4`
- `default-er-layout-plan-5`

## Local Verification Scope

- Source manifest links are validated.
- Source-to-plan mappings are validated.
- Default saved plan wrappers are validated.
- Nested plans are validated through `PlanContract`.
- Web render geometry proof loads all five plans.
- No-PHI and docs/contracts gates pass locally.

## Limits

The fixtures are approximate operational layouts only. They do not embed DOCX content, claim exact CAD geometry, seed a database, add a UI picker, change simulation behavior, or certify any layout.
