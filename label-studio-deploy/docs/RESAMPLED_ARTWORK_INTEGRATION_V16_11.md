# Nerdeus Label Studio — Resampled Artwork Integration v16.11

Date: 2026-11-05
Status: Production deployment successful; browser-level artwork/physical-print acceptance outstanding.

## Goal

Make the user-supplied 540 × 215 px resampled food engravings available to the Nerdeus Meals Label Studio without silently replacing established artwork, changing food-package facts, or modifying archived print images.

## Source and decisions

Source archive: `Nerdeus_Resampled_Elements_540x215_128x128_300DPI.zip` (saved in Library at `/Nerdeus Meals Workshop/Reference Assets/`). The food candidate version uses the exact **black-ink/transparent** PNG from the ZIP: no red pixels in food, no RGB intermediates, no partially transparent pixels. DPI metadata is 300 but native source detail cannot be recovered through upscaling.

| Candidate | Compatible proof label | Exact match requirement | Solid black pixels | Bounding box within 540 × 215 | Decision |
|---|---|---|---:|---|---|
| Ribeye steak | Raw plain beef | Food name contains RIBEYE | 31,731 | (69,20)–(458,200) | Selectable candidate |
| Chicken fajita kit | Raw meal kit | Food name contains FAJITA | 26,446 | (53,27)–(488,190) | Selectable candidate; confirm art represents the raw kit truthfully |
| Lasagna | Cooked meal | Food name contains LASAGNA | 23,776 | (88,17)–(462,201) | Selectable candidate |
| Broccoli florets | Single/prepped vegetable | Food name contains BROCCOLI | 30,053 | (83,13)–(453,195) | Selectable candidate |
| Stock pot | Sauce / stock concentrate | Food name contains STOCK; optionally soup/stew categories only with matching name | 19,845 | (70,17)–(462,187) | Selectable category illustration, not ingredient evidence |
| Bread loaf | Dry baking mix | — | — | — | Excluded; a baked loaf misrepresents an unprepared dry mix |

The eight resampled icon families remain in the existing v16.10 review gallery; printer/label-roll artwork is editor-UI-only and no icon is silently promoted to a printed label.

## Implementation

- `assets/artwork-candidates-v16_11.js`: self-contained transparent black PNGs, metadata and SHA-256 for five candidates, a read-only comparison gallery, and explicit user action to attach a matching candidate to an editable food label.
- `assets/proof-lab-v16_11.js`: supports `?view=proof&release=v16.11&art=resampled` to render the five matching examples with new artwork and the remaining twelve with their current illustrations. Use `art=original` to compare. Both modes use the same 591 × 827 artwork and the existing 576 × 827 printer raster.
- A candidate is attached to a **temporary proof document only** when the resampled proof mode is selected. It is never silently inserted into real package records or archives.
- The editable-label action requires an explicit click and confirmation, validates that the current food name/type matches, records the candidate's original source ID, retains the exact binary PNG, marks `pkg.artStatus=candidate`, `pkg.artworkReviewed=0`, `pkg.textOnlyApproved=0`, and never asserts print approval.
- The existing `LabelMasterV9.validate` reports an issue until artwork has been reviewed and approved. Physical B1 Pro output remains unverified.
- Only a user-initiated edit can modify browser storage, with failure rollback for an unsuccessful save. Existing snapshots are immutable.
- BG-103 remains the default botanical decoration. Transparent black illustration channels are composited via the existing candidate halo; no source-derived white underlay is promoted as an approved mask.
- The v16.10 64-file resampling ZIP and original v16.9 reference gallery remain available.

## Verification

**Completed:**
- All five candidate PNGs checked: 540 × 215, black-ink/transparent pixels only.
- Git asset modules passed JavaScript syntax checks and pinned Git blob integrity checks.
- Source-level replay tested the five correct fixture associations, verified black candidate images were available in document assets, verified source status remained `candidate`, and prevented assigning Lasagna artwork to Ribeye.
- Built an exact production HTML response from pinned source: 33 script elements, zero syntax errors, candidate script loads before the proof gallery, 102-check module remains present, historical-master auto-archiving remains disabled, and condensed title measurement remains active.
- Railway production v16.11 deployment SUCCESS; current source and deployed source agree; logs verified new candidate and proof assets.

**Still to be accepted:**
- Fresh, interactive browser comparison (the browser connector here is read-only; the sample gallery was not visually screenshot-tested).
- Actual runtime outcomes from 102 tests, plus review of the candidate-mode contact sheet.
- Confirm actual thermal red/black registration, illustration legibility and QR scans on the NIIMBOT B1 Pro before approving any new candidate for real packages.

## Future backend requirements

An artwork registry should store `asset_id`, immutable source SHA-256, original/upscaled size, binary color planes, print DPI metadata, category/food/cut compatibility, origin, draft/candidate/rejected/approved states, explicit review actor/date, physical print proof status, and a saved snapshot reference. Rendering should not infer cooking temperatures, allergens, use-by dates, package IDs or recipes from artwork.

## Links

Live candidate proof: https://nerdeus-label-studio-production.up.railway.app/?view=proof&release=v16.11&art=resampled&resampled=1

Original artwork comparison: https://nerdeus-label-studio-production.up.railway.app/?view=proof&release=v16.11&art=original

Editable label designer: https://nerdeus-label-studio-production.up.railway.app/?view=design&release=v16.11&resampled=1
