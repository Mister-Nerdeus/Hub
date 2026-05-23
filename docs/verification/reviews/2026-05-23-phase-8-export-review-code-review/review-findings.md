# Phase 8 Export Review Code Review Findings

## Findings

1. Fixed: Phase 8 web review fixture was generated at module load instead of being a static local JSON text fixture.

The previous `apps/web/src/fixtures/phase8ExportBundleReview.ts` constructed the export bundle with shared builders in the browser module and then stringified it. That weakened the import-review proof because the UI was not reviewing a static JSON export bundle fixture; it was reviewing a freshly generated in-memory bundle. The fix replaces it with static JSON text and keeps the invalid JSON path static as well.

2. Fixed: Export review view-model test did not assert deterministic scenario/report ID ordering.

The test now checks exact sorted scenario IDs and report IDs so future changes cannot accidentally loosen the deterministic summary contract.

## Residual Risk

The web fixture intentionally duplicates the current export bundle JSON text for an API-free proof surface. If the shared export fixture changes later, this Phase 8 web fixture should be updated deliberately as part of that contract change.
