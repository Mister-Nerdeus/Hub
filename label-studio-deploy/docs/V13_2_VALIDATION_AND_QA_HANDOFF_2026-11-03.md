# Nerdeus Label Studio v13.2 — Validation & package-workflow remediation

**Date:** 2026-11-03  
**Live:** https://nerdeus-label-studio-production.up.railway.app/?template=master-cooked_meal&view=data  
**Railway project:** `d23d52cd-ba62-4f04-a6c5-00476d73a648`  
**Service:** `0a49ac30-6184-4a48-bf89-e4eec3bc5de8`  
**Successful deployment:** `3d64fffd-0551-42d0-bc34-a8897008a6d1`  
**Status at deployment:** Online; zero reported service warnings and recent deployment failures.

## Immutable checked-in sources

- `label-studio-deploy/index-v13_2.html` — Git blob `13d5edf704247c592b831b9f3675d6a6f391eabc`.
- `label-studio-deploy/assets/master-label-v13_2.js` — Git blob `cca658d2300ae1396624d073cbf0f539e6e67ba9`.
- Both are served by the existing Railway Bun function from immutable commit `57512067a966d938cad9fc436e74de58b9d68aea` with verified source blob SHA checks.
- Existing background BG-001–BG-101, 123 cut-illustration library, stored browser templates, v12 and v13 master file versions, and archived exact PNG snapshots are not intentionally overwritten.

## Fixes

1. **Critical header validator:** For `pkg.layoutStyle='heritage-v13'`, validate both actual header layers, bindings, visibility, size, contrast and equal font size. Do not require 66px height in each line. Older layouts retain their legacy rule.
2. **Date dependencies:** Respect causal ordering of purchase/prep/cook/season/marinate/assemble/blend, packed, frozen and opened dates. End-of-quality/use-by dates must not precede any recorded package event. Same-day transitions are valid. Invalid chronology now produces explicit messages.
3. **Packaging readability:** v13 validators flag >46 characters across the storage/packaging/portion print line. Render diagnostics also reject `Packaging material` text that shrinks under 20px. Keep full detail in the separate package record instead of silently reducing it below the reading threshold.
4. **Genuinely blank package:** `LabelMasterV9.makeBlank(def)` preserves category and the reusable decorative background but clears actual food identity, weight, storage condition, packaging, portions, allergens, action text, identifiers, dates, recipe references and sample food illustrations. Empty QR content is not drawn. The sample preset remains available as an example separately.
5. **Local uniqueness check:** Repeated non-demo package IDs in the current browser workspace are refused at snapshot approval and print-time, with a visible output warning. This does NOT implement cross-browser or database uniqueness.
6. **QA expansion:** `window.NerdeusV13QA.run()` now uses in-memory synthetic package fixtures to check positive full-package validation and negative tests for demo IDs, missing weight, corrupted header, long storage and impossible cooking chronology, in addition to raster palette, dimensions, crop, QR binding/quiet zone/black-only QR area, overflow and glyph-size checks. These synthetic approval flags do not change any user's data.
7. **Archived records:** v13.1 verified-snapshot model is unchanged. Print from archive uses the saved template and print-review record, not the editor's current template.

## Verification already completed

- Evaluated all 17 master definitions against the actual v8 mass/volume conversion function and the complete v13.2 master validator in an isolated local harness.
- Valid synthetic examples passed **17/17** full-package validations.
- Negative checks passed across the 17 types for demo IDs, missing metric quantities, corrupted v13 headers and overlong storage lines.
- A cooked-meal example with cooked date after packed/frozen is now blocked by three chronological errors, while a legitimate sequence validates.
- `makeBlank` produces no fake food, weights, IDs, storage or packaged food artwork, and hides the empty QR.
- All inline JS blocks in `index-v13_2.html` compiled successfully.
- Railway deployed the new files without service errors and reports the v13.2 function source as deployed.
- **NOT YET VERIFIED:** The actual browser's "Run 17-label raster QA" result, every live rendered v13.2 PNG's QR readability by camera/decoder, physical red/black registration, paper feed, and freezer durability.

## Manual/browser acceptance

Open the live cooked-meal link and hard refresh. Under **Label data**, confirm that the cooked-meal preset still displays sample data and carries a DEMO ID, then press **New blank package of this type**. It must be a separate draft, with no Beef Lasagna, no weight, no demo ID, no pre-filled storage/packaging, and no food artwork. Enter a real package record and dates, verify fields, and inspect **Output** for validation before printing.

Next select **Output → Run 17-label raster QA** and copy any error messages for evaluation. Print only after the stock, model ID and actual B1 Pro alignment are verified. Real data integration, shared ID issuance, and ingredient-derived allergens require a separate authenticated Nerdeus Meals backend workflow.

## Non-negotiable constraints

- Physical label size: 50 × 70 mm; artwork 591 × 827px at 300 DPI.
- Printer crop: 576 × 827 pixels; 7px left and 8px right dropped with no resampling.
- Rendered pixels: exactly pure red (#FF0000), black (#000000) and white (#FFFFFF).
- Food artwork uses black-only details; the decorative background remains independent red/white.
- QR encodes package ID only; no URLs or private data.
- Food-storage advice, dates, allergens and cooking temperatures must be reviewed against the actual package/recipe; no invented shelf-life policy.
