# Issue 206 ER Layout Metadata Audit

## Scope

This audit consolidates metadata added in Issues 198-205. It does not add simulation execution behavior, pathfinding behavior, optimizer behavior, API persistence routes, deployment changes, patient records, diagnosis fields, clinical notes, EHR fields, or safety/compliance scoring.

## Canonical Fixture

Canonical fixture: `packages/shared/fixtures/plan-er-pod-phase2.json`

The web fixture mirror is `apps/web/src/fixtures/planErPodPhase2.ts`.

## Metadata Objects Represented

- `roomOperationalMetadata`
- `zoneOperationalMetadata`
- `hallwayOperationalMetadata`
- `doorOperationalMetadata`
- `stationOperationalMetadata`
- `entryOperationalMetadata`
- `overflowOperationalMetadata`
- `adjacencyOperationalMetadata`

## Audit Result

The canonical fixture represents every metadata object added by Issues 198-205. TypeScript and Python validation both load the fixture through their respective contract validators. The local no-PHI gate remains the source of truth for PHI-like field and text checks.

## Explicit Non-Claims

- This fixture does not certify a real ER layout.
- This fixture does not represent PHI, patient identity, diagnoses, clinical notes, EHR fields, or patient arrival records.
- This fixture does not change pathfinding, assignment scoring, simulation execution, or optimizer behavior.
