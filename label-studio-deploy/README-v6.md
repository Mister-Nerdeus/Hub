# Nerdeus Label Studio · v6 Deployment Notes

## Production
- URL: https://nerdeus-label-studio-production.up.railway.app/?template=meal&view=design
- Railway project: Nerdeus Label Studio (production).
- Source: `label-studio-deploy/index.html`, pinned from the immutable GitHub commit `c4e55618c8cc28fa5eaf95ab096eb9b56bd13f30`.
- Source integrity: git blob SHA-1 `ec0c97def9c12998216efd6ac3daa2a749110ac1`, checked before serving.
- Deployment source: Bun HTTP Railway Function. Failure to retrieve and verify the source returns HTTP 503 instead of silently reverting to previous radial artwork.
- `/version` exposes source verification, artwork parameters, printer geometry, template counts and converter readiness.
- `/tools/svg-converter` remains supported by independently pinned and checked SVG converter.

## Backgrounds
- 100 originals in `backgrounds-v6.js` across 10 groups: Comfort Kitchen, Herb Garden, Fresh Produce, Baker's Pantry, Pasta & Grains, Spice Market, Country Table, Soup & Supper, Fruit & Citrus, Coffee & Cocoa.
- Replace the former Radiant & Burst group. No sunburst or radial fan compositions.
- All images are programmatically drawn, quantized to opaque #FF0000 and #FFFFFF only, and exported as 540 × 215 PNGs.
- Existing BG-001–BG-100 identifiers are preserved. Built-in IDs resolve to the currently approved library rather than embedded outdated copies.
- User-imported images retain separate IDs, and legacy/archived print snapshots are not rewritten.
- These are distinct named motif compositions, but manual aesthetic approval of all 100 designs at print size is still required. Do not call them physically validated.

## Labels
- `templates-v6.js` defines 13 updated food labels: prepared meal, raw protein, dry-seasoned protein, marinated protein, raw meal kit, freezer packaging, side/component, leftovers, prepared ingredient, soup/stew, dry mix, pantry storage and advanced meal prep.
- Other 14 individual meat cut templates remain available.
- Labels reserve a dedicated artwork band (without putting critical text over the pattern), use a black information footer, include drawn calendar icons and QR, expose conditional thaw notes, and show red allergen bullets only when nonempty.
- Longer data values use autofit text in raster and SVG rendering. Print measurements remain 591 × 827 artwork, centered 576 × 827 printer raster, 300 DPI.
- Legacy uncustomized stock layouts migrate while retaining data and chosen background ID. Customized legacy layouts remain untouched with an optional modern alternative available.
- The source protects browser-local templates and archived print snapshots.
- The app remains a browser-local UX prototype. Dates, allergens, cook temperatures, storage and package IDs are samples, not verified data from the Nerdeus Meals backend.
- Physical print is blocked when relevant date fields have an empty value, SET DATE, MM/DD/YYYY, or TBD.
- Physical B1 Pro stock registration and scanner/print readability must still be tested. 50 × 70 mm is the current profile. 50 × 80 mm is not silently substituted.

## Verification
- GitHub scripts parsed successfully with JavaScript syntax checks before deployment.
- Railway deployment `0792e6d0-879b-4d2e-a9a7-c3c333947254` has status SUCCESS.
- Railway runtime logged the verified v6 source blob and exact page character length.
- Manual acceptance cases outstanding: compare all 100 thumbnails and names; apply BG-001 to an old saved template; confirm empty allergen produces no text; test an unusually long dish name; verify PNG quantization and QR; physically test B1 Pro alignment and full-width black/red prints.
