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
  sourceArtifactId: string;
  sourceRevision: string;
  sourceCapturedAt: string;
  sourceFilename: string;
  sourceDocumentPath: string | null;
  sourceType: "docx-layout-reference";
  sourceVisibility: "private-reference-only";
  publicExposureAllowed: false;
  runtimeServedByWeb: false;
  runtimeServedByApi: false;
  sourceSha256: string | null;
  sourceSha256Status: "not_archived_in_repo" | "verified";
  defaultPlanId: string;
  conversionOutputPlanId: string;
  defaultPlanName: string;
  conversionStatus: "not_started" | "mapping_started" | "draft_converted" | "validated" | "validated_default";
  auditStatus: "validated_default";
  nonPhiStatus: "source-reviewed-operational-only";
  limitations: string[];
}
```

## Rules

- Source DOCX documents under `docs/floorplans/` are private conversion references only, not product assets or structured truth.
- `sourceDocumentPath` must be `null` (or omitted) when source documents are not accessible from product/runtime paths.
- Manifest entries must explicitly keep `sourceVisibility` set to `private-reference-only`.
- Manifest entries must explicitly keep `publicExposureAllowed`, `runtimeServedByWeb`, and `runtimeServedByApi` set to `false`.
- `conversionOutputPlanId` must resolve to an existing converted JSON default plan fixture.
- Manifest entries must not embed DOCX binary data, base64 content, raw file text, extracted narrative text, or other source payload fields.
- Web runtime code must load converted JSON default plan fixtures only. It must not import, link, display, preview, download, or otherwise serve DOCX source files.
- API routes must not serve `docs/floorplans/` or any DOCX source file.
- Every source has one stable `sourcePlanId`, one intended `defaultPlanId`, a conversion status, and at least one limitation.
- Every source has one stable `sourceArtifactId`, `sourceRevision`, and `sourceCapturedAt` value for traceability.
- If source DOCX binaries are not archived in the repository, `sourceSha256Status` must be `not_archived_in_repo` and `sourceSha256` must be `null`.
- If source binaries are archived later, `sourceSha256Status` must be `verified` and `sourceSha256` must contain a lowercase SHA-256 digest.
- `conversionStatus` and `auditStatus` must not contradict each other. The validated default fixtures use `validated_default`.
- `sourcePlanId` and `defaultPlanId` values must be unique inside the manifest.
- Conversion to a default saved plan fixture is blocked until the source has a manifest entry.
- Source limitations must preserve approximation language. The drawings are visual layout references, not exact CAD geometry.
- Manifest text remains operational-only and must pass no-PHI checks.

## Source-To-Plan Mapping Contract

Source mappings connect visible source labels to intended structured plan objects. They are explicit review artifacts and do not infer exact geometry.

Mapping shape:

```ts
{
  schemaVersion: "1.0.0";
  mappingId: string;
  sourcePlanId: string;
  targetPlanId: string;
  objects: SourceToPlanMappedObject[];
  deferredSourceLabels: DeferredSourceLabel[];
}
```

Mapped object shape:

```ts
{
  sourceObjectId: string;
  sourceLabel: string;
  objectType: "room" | "hallway" | "door" | "nurseStation" | "zone" | "pathNode" | "pathEdge" | "annotation";
  targetObjectId: string;
  confidence: "low" | "medium" | "high";
  geometryApproximation: "manual" | "deferred";
  approximateCoordinates: {
    x: number;
    y: number;
    widthFeet?: number | null;
    lengthFeet?: number | null;
  } | null;
  notesCode: "source-label-position-approximate" | "source-visible-operational-object" | "source-label-grouped" | "source-label-deferred";
}
```

Deferred source label shape:

```ts
{
  sourceLabel: string;
  reasonCode: "needs-human-review" | "source-label-ambiguous" | "source-label-not-structured-yet";
}
```

Mapping rules:

- `sourcePlanId` must identify a source in the source layout manifest.
- `targetPlanId` must identify the intended default plan ID from the same manifest source.
- Every converted default JSON plan must have exactly one manifest entry and one source-to-plan mapping.
- `sourceObjectId` values must be unique within a mapping.
- `targetObjectId` values must be unique within mapped objects for a single mapping.
- Source labels remain source text and are distinct from validated target object IDs.
- Mapped object IDs must resolve to the collection matching `objectType`: rooms to `plan.rooms`, zones to `plan.zones`, doors to `plan.doors`, nurse stations to `plan.nurseStations`, hallways to `plan.hallways`, path nodes to `plan.pathNodes`, and path edges to `plan.pathEdges`.
- `annotation` mappings are rejected until annotation objects exist in the plan contract.
- Conversion completeness audits inspect the source manifest, source mappings, and converted JSON fixtures only. They do not read, render, expose, or serve DOCX files.
- Conversion completeness summaries must identify represented rooms, hallways, doors, nurse stations, entry/EMS or hall entry, provider/pharmacy areas, trauma areas, zones, path nodes, and path edges where present in the converted JSON plan.
- Deferred source labels must use coded `reasonCode` values and must not become free-text notes.
- Coordinates, when present, are approximate manual coordinates only.
- Notes and deferred reasons are coded enums, not free-text notes.
- Mapping text must pass no-PHI checks.

## Default Saved Plan Fixture Wrapper Contract

Default saved plan fixtures are read-only fixture records. The wrapper distinguishes default operational fixtures from user-created saved plans while keeping the nested plan inside the existing `PlanContract`.

Wrapper shape:

```ts
{
  schemaVersion: "1.0.0";
  defaultPlanRecordId: string;
  sourcePlanId: string;
  mappingId: string;
  readOnly: true;
  importStatus: "draft_converted" | "ready_for_review" | "validated_default";
  auditStatus: "validated_default";
  plan: PlanContract;
  limitations: string[];
}
```

Wrapper rules:

- `defaultPlanRecordId` must use the `default-plan-` namespace.
- Nested `plan.planId` must use the `default-er-layout-plan-` namespace.
- `readOnly` must be `true`; default fixtures are not user-authored saved plan records.
- `importStatus` must match `auditStatus` for validated default fixtures.
- `sourcePlanId` must link to a registered source manifest entry when references are supplied to the validator.
- `mappingId` must link to a registered source mapping when references are supplied to the validator.
- `plan` must validate through `PlanContract`.
- `limitations` must contain at least one operational-only limitation and must pass no-PHI runtime text checks.

## Non-Claims

This contract does not render DOCX files, serve DOCX files, convert layouts automatically, perform OCR, seed a database, add EHR support, add PHI support, or claim exact geometry.
