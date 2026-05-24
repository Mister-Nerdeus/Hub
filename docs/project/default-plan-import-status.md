# Default Plan Import Status

Status: validated default import layer.

The five default ER layout fixtures are registered, mapped, wrapped as read-only default plan records, traceable to source manifest entries, and validated through local TypeScript contract tests.
The private DOCX source files are removed from repository runtime artifact paths. Product runtime surfaces must use the converted JSON default plan fixtures and must not expose, preview, download, import, or serve DOCX source files.

## Fixture Coverage

- `default-er-layout-plan-1`
- `default-er-layout-plan-2`
- `default-er-layout-plan-3`
- `default-er-layout-plan-4`
- `default-er-layout-plan-5`

## Local Verification Scope

- Source manifest links are validated.
- Source manifest entries explicitly mark DOCX references as `private-reference-only`.
- Source manifest entries explicitly set `publicExposureAllowed`, `runtimeServedByWeb`, and `runtimeServedByApi` to `false`.
- `sourceDocumentPath` is `null` because source document files are private artifacts outside runtime paths.
- `conversionOutputPlanId` values resolve to JSON default plan fixtures.
- Source-to-plan mappings are validated.
- Source-to-plan mappings are validated against the correct target plan collection for each `objectType`.
- Source-to-JSON conversion completeness summaries are validated for all five default plans using manifest, mapping, and JSON fixture data only.
- Wrong `objectType` to target collection pairs are rejected, including annotation mappings until plan annotations exist.
- Deferred source labels remain coded and documented.
- Default saved plan wrappers are validated.
- Manifest `conversionStatus`, manifest `auditStatus`, and wrapper `importStatus` are aligned to `validated_default`.
- Nested plans are validated through `PlanContract`.
- Web render geometry proof loads all five plans.
- No-PHI and docs/contracts gates pass locally.

## Limits

The fixtures are approximate operational layouts only. They do not expose DOCX files as product assets, embed DOCX content, claim exact CAD geometry, seed a database, change simulation behavior, add assignment scoring, or certify any layout.
