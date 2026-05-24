# Floorplan Workflow Status

Current status: GO for the next route/walking-truth batch, scoped to validated JSON floorplans only.

## Verified Workflow

Private DOCX reference files remain conversion references only. Runtime workflow uses converted JSON default floorplans, duplicates defaults into editable JSON copies, stores editable copies locally, loads active JSON floorplans in the editor, supports JSON-only import/export, and separates developer proof modules behind Developer Proof Mode.

Post-batch code review confirmed the duplicate/save/load path is wired into the normal floorplan library: duplicated default JSON plans become local editable saved cards that can be opened or deleted without API or database persistence.

## Boundaries

- DOCX files are not product assets.
- DOCX files are not served by the web app or API.
- JSON floorplans are approximate operational fixtures, not exact CAD geometry.
- Imported JSON floorplans are editor-local drafts unless a later issue adds saved-store persistence.
- Developer Proof Mode is local UI state and not production navigation polish.

## Next Work

Route/walking-truth work may proceed only against validated JSON floorplans and must preserve the non-PHI, no-EHR, no clinical-safety, no exact-CAD, and no optimizer-before-scoring boundaries.
