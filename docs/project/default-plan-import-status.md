# Default Plan Import Status

Status: validated default import layer.

The five default ER layout fixtures are registered, mapped, wrapped as read-only default plan records, traceable to source manifest entries, and validated through local TypeScript contract tests.

## Fixture Coverage

- `default-er-layout-plan-1`
- `default-er-layout-plan-2`
- `default-er-layout-plan-3`
- `default-er-layout-plan-4`
- `default-er-layout-plan-5`

## Local Verification Scope

- Source manifest links are validated.
- Source-to-plan mappings are validated.
- Source-to-plan mappings are validated against the correct target plan collection for each `objectType`.
- Default saved plan wrappers are validated.
- Manifest `conversionStatus`, manifest `auditStatus`, and wrapper `importStatus` are aligned to `validated_default`.
- Nested plans are validated through `PlanContract`.
- Web render geometry proof loads all five plans.
- No-PHI and docs/contracts gates pass locally.

## Limits

The fixtures are approximate operational layouts only. They do not embed DOCX content, claim exact CAD geometry, seed a database, change simulation behavior, add assignment scoring, or certify any layout.
