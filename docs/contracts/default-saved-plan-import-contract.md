# Default Saved Plan Import Contract

Default saved plan import artifacts prepare ER layout reference drawings for later structured fixture conversion.

## Source Layout Manifest

`packages/shared/fixtures/default-plans/source-layout-manifest.json` is the source archive manifest. It records uploaded source document references without embedding source document bytes.

Manifest shape:

```ts
{
  schemaVersion: "1.0.0";
  manifestId: "default-er-layout-source-manifest";
  sources: SourceLayoutManifestEntry[];
}
```

Source entry shape:

```ts
{
  sourcePlanId: string;
  sourceFilename: string;
  defaultPlanId: string;
  defaultPlanName: string;
  sourceType: "docx-layout-reference";
  conversionStatus: "not_started" | "mapping_started" | "draft_converted" | "validated";
  nonPhiStatus: "source-reviewed-operational-only";
  limitations: string[];
}
```

## Rules

- Source documents are archive references, not structured truth.
- Manifest entries must not embed DOCX binary data, base64 content, raw file text, extracted narrative text, or other source payload fields.
- Every source has one stable `sourcePlanId`, one intended `defaultPlanId`, a conversion status, and at least one limitation.
- `sourcePlanId` and `defaultPlanId` values must be unique inside the manifest.
- Conversion to a default saved plan fixture is blocked until the source has a manifest entry.
- Source limitations must preserve approximation language. The drawings are visual layout references, not exact CAD geometry.
- Manifest text remains operational-only and must pass no-PHI checks.

## Non-Claims

This contract does not convert layouts, perform OCR, create structured plans, add UI, seed a database, add EHR support, add PHI support, or claim exact geometry.
