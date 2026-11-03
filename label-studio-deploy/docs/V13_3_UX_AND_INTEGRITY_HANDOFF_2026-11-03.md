# Nerdeus Label Studio v13.3 — UX, Package Integrity, and Print Layout Fixes

**Published:** November 3, 2026  
**Live:** https://nerdeus-label-studio-production.up.railway.app/?template=master-cooked_meal&view=data  
**Railway project:** `d23d52cd-ba62-4f04-a6c5-00476d73a648`  
**Service:** `0a49ac30-6184-4a48-bf89-e4eec3bc5de8`  
**Deployment:** `2cc806ed-f7ee-49e0-ae34-36cf5bb4b93c` (SUCCESS, zero warnings/criticals or recent failures)  
**Verified commit pin:** `b9c73bcd19e6f71ce9ca3cf51c7ed571b0237afc`

## Exact source blobs

- `label-studio-deploy/index-v13_3.html` — `673abe5aca9333fed997cce2c28b078798e30b22`
- `label-studio-deploy/assets/master-label-v13_3.js` — `eaacb6646f718a2543056fa7d395b89a16fb1864`
- Prior v13.2 files remain in the repository and may be restored by pinning the previous source commit and blobs. The Railway function was updated without changing or deleting browser-local data.

## Fixed from the November 3 cooked-meal audit

1. **Raw/cooked contradiction:** A type-specific `pkg.state` validator now requires the state appropriate to each canonical label type. A raw state on `cooked_meal` is rejected rather than silently printing `COOKED MEAL`.
2. **Text collisions:** Moved the actual food name to y=373–411 and the optional contents descriptor to y=416–439, with five pixels of separation. Removed the one-pixel overlapping header draft indicator. Added a visible-text rectangle overlap detector to the core diagnostics, checked in the Output tab and in the 17-label QA.
3. **Template versus package:** New package creation and JSON package import generate separate `package-...` instances with `pkg.recordRole='package'`. The example defaults use `pkg.recordRole='example'`. Imported records **do not mutate the master**. Both roles use the same canonical 17 type IDs and can use the existing editable schema.
4. **Package picker:** Separate **17 reusable label types** and **My packages** filters. Package entries display their food name or draft title and package ID. Older custom and historical designs remain accessible.
5. **Progressive entry:** Reorganized the data inspector into five numbered sections: food, quantity/container/storage, dates, safety/allergens/ID, and review. Artwork, extra metadata, and offline JSON import are separate collapsed sections. All 18 fields have associated HTML labels; each of the four date rows has identifiable type/date controls.
6. **Approvals:** Changing food name no longer clears verified quantities and dates. Validation resets the specific approval category affected by a data change, such as date review for a changed date or safety review for a changed handling instruction.
7. **Advanced geometry:** Position/size edits made by dragging or in element properties are stored per element as `userGeometry`, retained after later data edits and JSON serialization. A user-confirmed reset restores default master geometry.
8. **Mobile:** The data inspector includes a sticky, compact live label preview on narrow screens, without creating a second print renderer.
9. **Touch background selection:** On coarse-pointer/touch devices, tapping a background opens a full preview with a separate **Apply this background** button. Desktop hover/focus preview is retained.
10. **Snapshot history:** Archived cards show their original package ID, timestamp, canvas dimensions, content SHA-256 excerpt, and whether the record was print-ready at archive. Reprint is visibly disabled on draft/legacy records.
11. **Local and archived ID collisions:** The snapshot and new print paths check package-ID reuse across the current browser workspace and the browser's existing archive. This is local-only; shared multi-device uniqueness requires an authenticated backend.
12. **Raster QA:** The 17-label QA includes positive package-data checks and negative tests for demo IDs, missing quantity, wrong preparation state, mismatched headers, oversized storage, impossible cooking chronology, and injected name/contents overlap. The print QR area is checked for only black/white pixels, and actual sampled printer-crop QR bits are compared with the ID-only matrix.

## Tests completed

- 17/17 canonical masters passed the full validator with internally consistent synthetic data.
- 17/17 rejected conflicting preparation states.
- 17/17 blank package instances contained no sample food, quantity, storage, ID or food illustration.
- 17/17 default examples had no overlapping visible text rectangles.
- Custom element geometry survived a package-name edit; reset restored defaults.
- Targeted approval invalidation preserved unrelated reviews.
- Synthetic font-width stress tests at width factors 0.55 / 0.65 / 0.74 found no clip, tiny-type, QR-size or label-text overlap errors on all 17 defaults.
- Deliberately injected name/content overlap was detected.
- Form smoke tests confirmed seven groups (five primary + advanced + import), 18 labeled fields, four date groups, eight review checkboxes, and a mobile preview in both example and blank-package roles.
- Offline JSON import handler was smoke-tested: captured an imported record as a new package callback and left the reusable master data unchanged.
- All 16 inlined JavaScript sections parsed successfully.
- Railway deployment succeeded, has no staged changes, and the deployed function pins the two exact SHA-verified v13.3 sources.

**Not yet verified:** the actual live browser's interactive screenshot or v13.3 raster QA button output, printer-connected QR scans, red/black physical registration, stock feed, freezer durability, and backend issuance of globally unique package IDs. Software module/geometry testing is not hardware approval.

## How to review

1. Hard-refresh the live URL (`Ctrl+Shift+R`).
2. In the cooked-meal example select **Create new empty package**. Confirm the sample lasagna, weights, package ID and artwork are not copied.
3. In the **My packages** picker open that draft. Complete the food, quantity, dates, allergen and action sections; the review checklist displays all pending issues through an expandable list.
4. Use **Advanced artwork and stored metadata** only when changing the background, icon or label layout.
5. Use **Output → Run 17-label raster QA**, inspect any warnings, and verify printer output only using real stock and the physical B1 Pro.
6. Use **Print snapshots** to review the specific package ID and its original approval state; unapproved archive records remain downloadable but are not directly reprintable.

## Important boundaries

- Artwork remains 591 × 827 pixels at 300 DPI, cropped 7 left / 8 right to the 576 × 827 printer raster without resampling.
- Pixel colors remain exactly black (#000000), red (#FF0000), white (#FFFFFF); actual food artwork is black-only, independent of red/white decorative engraving.
- QR payload is the package ID only, never a URL.
- No automatic shelf-life or food-safety assertions were introduced.
- Saved browser state and old snapshots were not deleted; older v12/v13 layouts remain available.
- Background catalog remains 101 and meat-cut artwork catalog 123.
- There is still no shared Nerdeus Meals package backend, ingredient-derived allergen synchronization, or globally unique ID service. These must be integrated with authorization separately.
