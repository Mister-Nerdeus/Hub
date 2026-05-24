# ER Layout Metadata Contract

This contract defines how ER operational metadata must be added to layout contracts.

## Purpose

ER layout metadata is operational simulation input only. It supports future pathing, assignment, scoring, and optimizer realism without adding patient records, clinical documentation, EHR data, or safety/compliance claims.

## Architecture Pattern

Metadata must be nested under explicit operational metadata objects. Do not add uncontrolled top-level fields such as `roomClass`, `staffVisibility`, or `doorDelay` directly to existing layout objects.

Current metadata containers:

- `roomOperationalMetadata` on rooms.
- `zoneOperationalMetadata` on zones.
- `hallwayOperationalMetadata` on hallways.
- `doorOperationalMetadata` on doors.
- `stationOperationalMetadata` on nurse stations.
- `entryOperationalMetadata` on entry path nodes.
- `overflowOperationalMetadata` on rooms or overflow-capable spaces.
- `adjacencyOperationalMetadata` on rooms or other explicitly documented layout objects.

Issue 198 created strict placeholder containers only. Issue 199 defines `roomOperationalMetadata`; later issues must define the exact fields for the remaining containers before fixtures use those fields.

## Room Operational Metadata

`roomOperationalMetadata` is optional on rooms. When present, it must use this operational-only shape:

```ts
{
  roomNumber?: string | null;
  roomClass: "standard" | "trauma" | "isolation" | "behavioral" | "procedure" | "hall_bed" | "overflow";
  capacityCategory: "single" | "double" | "hall" | "overflow";
  traumaAdjacent: boolean;
  isolationReady: boolean;
  behavioralReady: boolean;
  sitterCapable: boolean;
  lineOfSightLevel: "low" | "moderate" | "high";
}
```

`roomNumber` is an operational label only and remains covered by the runtime no-PHI text guard. The other fields are closed enums or booleans. No free-text room metadata fields are allowed.

## Zone Taxonomy and Operational Metadata

`zoneType` is an explicit ER operational taxonomy and must not be inferred from labels. Allowed zone types:

- `triage`
- `provider_area`
- `pharmacy`
- `medication_room`
- `ems_entry`
- `ambulance_entry`
- `waiting`
- `staff_only`
- `supply_storage`
- `clean_utility`
- `dirty_utility`
- `behavioral_zone`
- `isolation_zone`
- `trauma_zone`
- `hallway`
- `overflow`
- `family_consult`

`zoneOperationalMetadata` is optional on zones. When present, it must use this operational-only shape:

```ts
{
  zoneClass: "patient_care" | "staff" | "entry" | "support" | "storage" | "public" | "overflow";
  publicAccess: boolean;
  staffOnly: boolean;
  supportsPatientFlow: boolean;
  supportsClinicalOperations: boolean;
}
```

Zone labels remain operational labels only and stay covered by runtime no-PHI text guards.

## Hallway Operational Metadata

`hallwayOperationalMetadata` is optional on hallways. Hallway geometry remains feet-based through existing `widthFeet` and `points` fields. When present, metadata must use this operational-only shape:

```ts
{
  hallwayClass: "main" | "side" | "staff_only" | "ems" | "overflow";
  allowsBedMovement: boolean;
  allowsPublicTraffic: boolean;
  staffOnly: boolean;
  congestionLevel: "low" | "moderate" | "high";
  bottleneck: boolean;
  throughRoute: boolean;
}
```

This metadata does not change pathfinding, walking calculations, fire-code analysis, stretcher/bed movement safety, or compliance status.

## Field Rules

Allowed metadata field shapes:

- Enum values with closed taxonomies.
- Booleans for operational capabilities or flags.
- Numeric values with explicit units and validation bounds.
- References to known layout object IDs, validated against the parent plan.
- Arrays of validated references when ordering is deterministic.

Forbidden metadata field shapes:

- Free-text notes or narrative descriptions.
- Patient identity, contact, insurance, government identifier, visit, encounter, chart, lab, or discharge text.
- Diagnosis, chief complaint, treatment, clinical note, or clinical recommendation text.
- EHR import, export, mapping, or sync identifiers.
- Clinical safety, staffing compliance, legal compliance, code compliance, or certification claims.

## Naming Rules

- Metadata container names must end with `OperationalMetadata`.
- Fields inside metadata containers must use operational nouns, not clinical nouns.
- Reference fields must end with `Id` or `Ids` and identify the referenced object type in the field name, such as `nearbyStationId`.
- Numeric fields must include units in the name unless the enum or contract section makes units explicit.
- Boolean fields should use `is`, `has`, `allows`, `supports`, or another clear operational predicate.

## Validation Rules

TypeScript and Python contracts must stay aligned:

- Metadata containers are optional unless a future fixture explicitly requires them.
- Unknown fields inside metadata containers are rejected.
- Unknown top-level metadata-like fields on existing objects are rejected.
- Metadata references must be validated by the plan-level reference validator when fields are introduced.
- Rejection messages must not echo rejected text values.

## Non-Claims

This contract does not add simulation behavior, pathfinding behavior, assignment scoring, optimizer behavior, production deployment behavior, clinical safety certification, staffing compliance certification, legal compliance, EHR support, or PHI support.
