# Reference Element Extraction — Audit and Integration
Date: 2026-11-05
Project: Nerdeus Meals · Label Studio
Release: v16.9
Input: Nerdeus_Red_Black_Element_Breakdown.zip
Input SHA-256: 55ed0a0570a2e6227c16e651b54b8966c364b053b8853d9fe7a3a7ec4c860103

## Outcome
The uploaded ZIP is a **reference-asset extraction**, not an approved new label design. It contains 84 entries: 80 PNGs, two JSON files, one README and one Python extraction script. Its documented colors and alpha were independently verified for all 80 PNGs as exact white, pure black and pure red (or fully transparent), with no intermediate alpha. The source graphic, however, was flattened 1536 × 1024 RGB with 93,552 original RGB colors and no resolution metadata; reduction to two print planes cannot restore missing detail.

### Elements to evaluate
| Extracted food reference | Original crop | Applicable template | Review decision |
|---|---:|---|---|
| Ribeye steak | 259 × 114 | Raw plain beef | Candidate; verify at true printer raster size |
| Chicken fajita kit | 280 × 116 | Raw meal kit | Candidate; example-only |
| Lasagna | 235 × 115 | Cooked meal | Candidate; visual proof required |
| Broccoli | 236 × 118 | Single/prepped vegetable | Candidate; category match; inspect print density |
| Stock pot | 263 × 122 | Stock / soup / concentrate | Candidate as *category illustration*, not content depiction |
| Finished bread loaf | 267 × 96 | Bread dry mix | **Reject as product art**; finished loaf incorrectly represents dry mix |

Extracted icon shapes: calendar, calendar/footer, droplet, label roll, printer, snowflake, stock pot and thermometer. Calendar, snowflake, thermometer, droplet and stock pot are potential small-print pictograms after testing. Printer and label-roll belong to **editor controls only**. All icon crops are source-resolution raster shapes, not vector masters.

### Layers and render semantics
- Use exact white base first. Approved BG-103 culinary red botanical art remains the current **default**, unaffected by this study.
- A food illustration may need an opaque white underlay that clears both hypothetical printer channels under its black detail; transparent black-only ink over BG-103 can allow red through.
- The ZIP's inferred white-silhouette underlays were constructed by contour filling; **they are not approved**. The v16.9 preview deliberately uses a simple white rectangular knockout to prevent unintended red-over-food.
- Red and black channel plates for the flattened marketing graphic are useful as separation test cases only. Do not print them as individual food package labels.
- Keep text, quantities, event rows, allergens, validated cooking guidance, dates, and package-ID-only QR **dynamically rendered**, rather than importing their rasterized sample crops.

### Explicitly rejected content and assumptions
Do **not** put 'NERDEUS MEALS' into food-label headers. Do not import the source marketing sidebar, printer/roll pictures, sample QR, 'ALLERGENS: NONE', unverified temperatures, thaw windows, recipe-yield values or guessed quality dates into real package data. An empty allergen list is not an allergen-free declaration.

### Color, scale, printing
- Package is 300 DPI **tagged**, but native detail remains only around 235–280 px food width; a higher DPI tag does not create new detail.
- Current full-size design profile: 50 × 70 mm, 591 × 827 px; output raster: 576 × 827 px (7 px crop left, 8 right). Printing and QR scanning on the NIIMBOT B1 Pro are still unverified.
- Candidate art must be reviewed at its enlarged size and print-safe minimum pixel widths before promotion.

## Implemented project change (v16.9)
- Created `label-studio-deploy/assets/reference-elements-v16_9.js` from the uploaded ZIP (embedded 1-bit food and icon atlases, with original crop geometry and review metadata).
- Pinned module in Railway source using Git blob SHA `e606833748947437b370aa529cdf976a17ee0a35` and the immutable GitHub commit `cc3874242165ca0a6aa12460a9b99900e18bdd92`.
- Deployed an isolated `Reference elements from ZIP` review section near the existing 17-label proof lab. Add `&elements=1` to the proof URL to show it expanded.
- Preview cards display **six food crops** with safe white knockout over the current approved red background, plus **eight icon families**.
- Preview canvases verify exact white/red/black output pixels; no browser-local package, saved template, snapshot, or printer write occurs. The bread-loaf illustration is flagged not for use on dry-mix labels.
- The default template version and botanical background remain **v16.7 / BG-103**. No extracted art is automatically approved or assigned to existing packages.
- Persisted the full original ZIP and the self-contained JavaScript asset into the user's Library under `/Nerdeus Meals Workshop/Reference Assets/`.

## Verification
- 80 of 80 PNG files independently checked for exact-palette and binary alpha.
- GitHub asset content read back exactly; JavaScript parsed.
- Reconstructed the full rendered page before deployment: 31 script tags, 0 JavaScript syntax errors; the new reference module and v16.8 proof lab both present; saved-master migration guard remains.
- Railway function source readback v16.9, deployment **SUCCESS**, and logs report `HERITAGE v16.7 VERIFIED elements169 27091`.
- **Still open:** visual browser interaction test of the new gallery, approval/rejection of each candidate at native print size, complete 102-case runtime results, and actual B1 Pro print test.

## Next engineering gates
1. Inspect the new gallery in the live browser at `/?view=proof&release=v16.9&elements=1`. Confirm food cropped dimensions, white knockout, no overlaps or aliasing, and visible icons.
2. Select which of the five suitable food drawings and five package icons to redraw or approve. Produce new originals at the intended final render size; do not upscale and claim missing detail was restored.
3. Add an approval-based artwork registry (candidate / approved / rejected), transparent/underlay semantics, original source provenance, and per-asset print proof status to the future backend spec.
4. Generate a 17-type label proof gallery and record the 102-check results. Repair actual overflows, palette defects and QR scaling failures.
5. Validate physical two-color output and QR scans before printing real food-package labels.

