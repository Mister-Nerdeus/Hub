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

Issue 198 creates strict placeholder containers only. Later issues must define the exact fields before fixtures use those fields.

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
