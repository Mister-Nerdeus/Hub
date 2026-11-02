# Nerdeus Label Studio v8 — Conditional Packaging System
Deployed November 2, 2026 to the existing Railway Function: `nerdeus-label-studio`.
Production page: https://nerdeus-label-studio-production.up.railway.app/?template=meal&view=design
Runtime release: v8.0-package-labels.

## New v8 package templates
`assets/package-labels-v8.js` adds 12 builtin templates:
- Raw protein
- Prepped raw ingredient
- Raw ingredient combination
- Raw meal kit
- Cooked ingredient/component
- Cooked side
- Complete cooked meal
- Leftovers
- Soup/stew
- Sauce/concentrate
- Dry bread/meal mix
- Pantry ingredient

Each template is `nlsDesignVersion:8`, `kind:"package"`, with all bound values under `pkg.*`. All old v6 templates and 14 raw cut templates remain available. Saved templates are restored and newly introduced builtins appended, not overwritten; print snapshots are left unchanged.

## User flow
Select the desired package template on the left, then open Label Data on the right. The category selector opens another independent package template; use New copy for a new package based on that template. Edit actual food name, contents (when needed), metric and imperial quantities, portion count, storage condition, packed/prepped date, use-by/best-quality date, handling directions, optional temperature and thaw note, confirmed allergens, and actual package ID. Record-only fields: packaging, recipe reference and location.

## Print safeguards
All builtin package examples are SAMPLE only; demo IDs and missing dates intentionally block physical printing. Validation checks:
- Real ISO packed/prepared and end date; end date cannot precede packing
- Unique-format non-demo package ID (backend uniqueness cannot be guaranteed)
- Both unit systems (g/kg ↔ oz/lb; mL/L ↔ US fl oz), with rounding tolerance
- Required contents for raw ingredient combinations and raw meal kits
- Cut-specific cook target for raw-protein template
- Reheat target for templates marked REHEAT
- Print QR must contain only `{{pkg.id}}`
- Manual confirmation of food identity, dates, quantities, storage and instructions
- Separate allergen confirmation; blank allergen field does NOT assert allergen-free
- Confirm any illustration depicts actual food (not a cooking or serving vessel)

Changing an input resets review confirmations and restores the red SAMPLE notice. The user can export sample PNGs for review; those still show SAMPLE. Actual physical printing is blocked by `LabelPackages.validate(doc,true)` until checks pass.

## Artwork
No unapproved generated meal images are bundled here. Raw-protein example uses the existing black/white chicken breast cut illustration; other new templates intentionally leave the illustration zone empty or use written contents. Approved 100 background PNG assets remain unchanged in `assets/backgrounds-approved-v7.js`. A cooking pot, tray, plate, or serving bowl should never be shown unless included in the actual package. The editor's generic illustration-picker still needs content-aware matching and the expanded 123 asset library.

## Limits / future integration
This is a browser-local editor, NOT an inventory-connected package generator. There is no live lookup of recipe ingredients, verified allergens, actual package dates, or cooking method. The QR encodes the package ID only, not a URL; scanning is not yet integrated with the Nerdeus Meals backend. The B1 Pro physical printer alignment and dual-color print output have not been validated here.
Stock profile remains 50 × 70 mm: 591 × 827 @ 300 DPI; printing crop 576 × 827. Data is retained in browser-local storage and editable template JSON exports.

## Test notes
- JavaScript module parsed successfully, 12 templates constructed, all with a package-ID-only QR and fewer than 100 layers.
- Simulated cooked-meal record with real dates, proper ID, matching units and confirmations: 0 validation issues.
- Quantity mismatch is detected; end date before packing is rejected.
- Edits revoke confirmations and re-enable SAMPLE status.
- Railway deployment ID f9ae5a88-df5c-4778-b5e6-0cc9076edf7d reports SUCCESS.
- Railway deploy log: v8 page SHA verified; package module SHA verified; approved 100 artwork bundle SHA verified.
- **Manual browser and physical-printer acceptance testing still outstanding.**

## QA acceptance checklist
1. Open production in a fresh browser, confirm 12 package templates first.
2. Select Raw ingredient combination; Label Data displays editable contents; change to FROZEN, observe BEST QUALITY BY.
3. Leave allergens empty; no allergen section prints.
4. Select Complete cooked meal; verify REHEAT instructions and 165°F / 74°C sample require manual confirmation, not automatic assumptions.
5. Replace demo ID with a real ID; scan QR to verify its payload equals the ID only.
6. Try printing with a missing date; it must reject.
7. Try quantity 400 g / 25 oz; print preflight must flag mismatch.
8. Confirm an existing saved v6 template and an archived print snapshot still render/download unchanged.
9. Verify that no cooking vessel appears as food artwork in the new packaging templates.
10. Compare raster and physically print with tested 50 × 70 mm stock before approving production usage.
