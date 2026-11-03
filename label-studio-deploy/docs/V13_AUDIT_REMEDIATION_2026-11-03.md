# Label Studio v13 — audit remediation, deployment, and acceptance

**Date:** November 3, 2026  
**Live application:** https://nerdeus-label-studio-production.up.railway.app/?template=master-cooked_meal&view=data  
**Railway project:** `d23d52cd-ba62-4f04-a6c5-00476d73a648`  
**Railway function service:** `0a49ac30-6184-4a48-bf89-e4eec3bc5de8`  
**Deployment:** `059ad7ab-bc87-4d1e-a07b-0c37d40970a3` (successful)

## Delivered

- Fixed the old `?template=meal` alias to resolve to `master-cooked_meal`. Template navigation now persists exact IDs instead of generic kinds.
- Retained 17 canonical label types, 101 background designs, all existing cut-art assets, and the same 591×827 design / 576×827 print crop.
- New defaults use **Heritage v13**: equal-size two-line category text, red band above black band; black-only food artwork against red/white background; separate food name, dual prominent units, compact storage+packaging line, optional red allergen line, dates bottom left and ID-only QR bottom right; no solid white-center mask.
- Increased font sizes on critical fields; added measured text-overflow, tiny-type and QR-module print checks. Small dimensions still require on-paper approval.
- Preserved legacy v12 layouts and their current geometries. Existing saved labels upgrade only by explicit **Upgrade this label to Heritage v13** action in Label data; all review gates reset upon upgrading.
- Added focused mode: the default master workflow prioritizes label type and package fields, while a toggle reveals background, cut art, layers and advanced controls. Legacy templates keep advanced controls visible.
- **Archived reprint fix:** Print setup validates the captured snapshot template and approvals, not the active editor. New snapshots include `printReview` metadata, saved record and SHA-256. Old/unapproved snapshots remain downloadable but are blocked from direct reprinting until reviewed and re-archived.
- Added offline **Nerdeus Meals package JSON** import in the data editor. Only `nerdeus.meals.package.v1` matching the selected type is accepted, and all approvals reset. This is an interoperability contract, **not** live app/backend sync.
- Added **Run 17-label raster QA** in the Output inspector, which renders all sample templates in the browser, checks palette/crop/QR metadata, common overlaps and text overflow; results stay local. Manual printing/phone scans remain pending.

## Immutable source and compatibility

- Main HTML: `label-studio-deploy/index-v13.html`, blob `b02ab0aa4cb382842275f761c3d7de8898519e60`.
- 17-type master module: `label-studio-deploy/assets/master-label-v13.js`, blob `a124ca55152f1ab39b175e50d23baf1bb396ec47`.
- Candidate food artwork: `heritage-art-v12.js` (17 preview assets), remains a candidate until reviewed.
- Heritage background: `heritage-bg-101-v12.js`. Previous BG-001–BG-100, v9/v12 source files, older snapshots and browser-local files were not replaced.
- The Railway function loads immutable GitHub blobs with checksum verification. Fails closed on source-integrity errors.

## QA facts versus open items

**Confirmed:** 17/17 definitions pass structural tests: matching headers, valid bound QR field, full bounds, no large center knockout, present food-art asset, and demo print gates remain on. Railway deployment succeeded with no reported warnings. Earlier v12 standalone print proofs passed 17/17 QR decodes and strict black/red/white pixel checks, but that does **not** prove v13 browser-rendered samples pass.

**Not yet verified:** Actual interactive browser QA button results, v13 live render-and-QR scan output, real 50×70 mm stock feed, two-ink registration and device print quality. Do not label these tests as passed without evidence.

## Hardware acceptance procedure

1. Load verified red/black dual-color 50×70 mm stock in NIIMBOT B1 Pro.
2. Confirm actual printer model and target width; application assumes 576-dot printhead output cropped by 7 px left and 8 px right.
3. Run **Output → Run 17-label raster QA**; resolve all reported overflow/palette/geometry problems.
4. Complete real record fields, verify actual allergens/dates and instructions, approve food art, then create a new print snapshot.
5. Print one raw protein, one prepped ingredient mix and one cooked meal. Measure margins, physical font sizes and ink registration; scan the QR with a phone and verify that it contains **only** the package ID.
6. Store a printed test label on freezer packaging and evaluate adhesion, scuff resistance and legibility over time. These are experimental tests, not assumed printer compatibility.

## Limitations

Data and snapshots currently live in the browser; there is no shared cloud package database, automated ingredient-derived allergen import, or working API synchronization with Nerdeus Meals. External integration requires backend endpoints and authorization in the actual Meals application. A future app implementation should map its package record to the offline JSON contract, then add authenticated per-package lookup by QR ID.
