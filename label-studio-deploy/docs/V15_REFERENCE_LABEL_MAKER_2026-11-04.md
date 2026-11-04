# Food Label Studio v15 — Reference-style label-maker update
Date: 2026-11-04

## Source reference
Use the user-approved NIIMBOT red-and-black freezer label board with six representative labels: PORK CHOPS, TERIYAKI CHICKEN THIGHS, CHICKEN FAJITA KIT, BEEF LASAGNA, DICED ONION and WHITE BREAD MIX. The board's visually demonstrated layout, not its placeholder temperatures or quality dates, is the design authority. **No "Nerdeus Meals" lettering on labels.**

## Production link
https://nerdeus-label-studio-production.up.railway.app/?template=master-raw_marinated&view=data&release=v15
https://nerdeus-label-studio-production.up.railway.app/?view=create&release=v15

Railway project d23d52cd-ba62-4f04-a6c5-00476d73a648
Service 0a49ac30-6184-4a48-bf89-e4eec3bc5de8, production environment 8dfd8487-0055-43f3-b59f-13bdc425ae6d.

## Actual editable label design
- Red header with independently editable, actual **product name** (not company branding).
- White circular, species-aware header icon: pork, chicken/turkey or generic steak when supported; dry-mix bread, vegetables or cooking/bowl as appropriate.
- Black rounded status strip showing preparation/state and storage from the package record.
- Black/white engraved food artwork centered against a red/white decorative botanical background. Food imagery must stay black/white; decorative red is separate.
- One factual cut/ingredient descriptor line, editable from recorded contents and attributes.
- Two equal-prominence net-quantity numbers, metric and imperial, with narrow red separator.
- Packaging/type line, generated from recorded container and quantity units.
- Conditional **red pill allergens** with white lettering, only when actual allergens are recorded; blank allergen list means a blank region, never an "allergen-free" claim. If all recorded allergens will not fit, the print gate blocks approval rather than omitting data.
- Red-rule separated QR/date block: QR ID only, four source-dated event rows and relevant red calendar/snowflake pictograms. Current QR placement is on the **left** to match the reference.
- Black rounded footer with a white preparation/use pictogram and up to two lines of source-verified directions. Never auto-populate temperatures or reheating times from the reference graphic.
- Thin red outer frame. Exact white/red/black rasterization; no gradients on physical labels.

### Geometry of the new v15 reference layout
The current production label hardware profile remains **50 × 70 mm**, **591 × 827 px artwork**, and **576 × 827 px centered B1 Pro printer crop**. This is intentional so no installed output geometry, historical package labels, printer profile, or archived PNG data is silently changed.

The **reference image specifies 50 × 80 mm**. A future optional, genuinely calibrated 50 × 80 mm format requires an independent **591 × 945 px** artboard and corresponding **576 × 945 px** printer raster with profile-aware templates, validation, print snapshots, reprint preservation, CSS preview dimensions, and a real hardware/stock test. It is a remaining deliverable, **not** claimed as completed by this design-only release. Do not simply stretch existing 591×827 images to 945 height or relabel a 50×70 physical print as 50×80.

### Reference master style identification
- Master template IDs remain `master-raw_plain`, `master-raw_seasoned`, etc. for all 17 canonical IDs.
- New masters use `pkg.layoutStyle='reference-v15'` and `pkg.templateRevision='v15'`.
- Existing saved canonical masters with an older revision are archived as Previous layout, then replaced by new defaults. Saved individual package records remain unchanged by default.
- The advanced inspector offers an **Apply reference v15 layout** button for older saved packages. Food facts, package ID, selected art assets and manual element geometry remain; visual review/text-only approval resets.
- Immutable historic print PNG snapshots and their checksums are never rewritten. A new reviewed snapshot must be made for a changed v15 composition.

## Source artifacts (versioned and editable)
- `label-studio-deploy/index-v15.html`: core editor, browser-local package workflow, label profile, templates, QA, print archive, routing.
- `label-studio-deploy/assets/master-label-v15.js`: 17 canonical types, default v15 layout identity, printed-field/handling validation, opt-in migration, reference motif hooks.
- `label-studio-deploy/assets/reference-label-v15.js`: pure-reference composition, header species icons, conditional allergen badges, dated event icons, black footer pictograms, v15 data-driven geometry.
- `label-studio-deploy/assets/workflow-v14_4.js`: existing guided type → details → artwork → review workflow; label maker invokes v15 master defaults.
- Other existing background and food-cut assets are preserved; BG-101 is the chosen default red culinary engraving for new v15 examples, but user-selected BG IDs must not be overwritten.
- Railway Bun Function serves only immutable, hash-verified sources; `/healthz` requires the reference style to be verified before returning success.

## Tests performed
1. All **17/17** canonical types generated valid blank v15 reference packages; each has the new red product header, black status, food-art region, separate ingredient text, two quantity fields, conditional allergen capsule layer, QR package ID, dated pictograms, instruction icon and red border.
2. All **17/17** types passed synthetic valid-data package validation.
3. No reference template prints "NERDEUS MEALS" in its text layers.
4. Normal `WHEAT, MILK, EGG` list fits the new pill row. Empty allergens leave the row empty; oversized lists are blocked rather than silently truncated.
5. Source JavaScript syntax verified for master, reference artwork module and 12 inline HTML scripts.
6. Element-position collision simulation found no overlapping visible text boxes among the 17 reference types.
7. The B1 Pro portrait/print-raster dimensions and exact three-color palette constraints were retained.

### Acceptance not yet performed
- Real interactive click testing and browser screenshot of v15 in a controllable session, including any preexisting custom saved package imported from a v14.5 browser.
- Hardware B1 Pro print, actual red/black registration, QR code scan, adhesive and freezer-condensation testing.
- A calibrated physical **50 × 80 mm** mode (this release keeps 50 × 70).
- Test actual food allergen and cooking instruction source evidence. No source-free temperatures or use-by dates are generated.

## Recommended follow-up work
- Build optional profile-aware 50×80 physical output rather than changing old profile globally.
- Add precise artwork-crop guidance and preview adjustments for longer product titles.
- Replace assets with approved engraving/cut candidates where current icon or art is misleading, preserving stable IDs and archived prior designs.
- Run real Chromium acceptance tests. Existing repository GitHub Actions have previously failed before executing steps and are not proof of UI success.
- Later backend: store `LabelTemplateRevision`, `PackageRecord`, source evidence, `ArtworkAsset`, `PrintSnapshot`, `PrintAttempt`, profile-aware print geometry, physical QA and backup/restore with provenance.
