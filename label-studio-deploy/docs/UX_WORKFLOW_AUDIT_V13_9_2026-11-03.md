# Nerdeus Label Studio v13.9 — End-to-end UX and reliability audit
Audit date: 2026-11-03
Scope: live connected page, deployed source, label-type flow, package data, artwork, browser persistence, archival snapshots, single print, mixed queue, printer compatibility.
Status: audit only. NO production code or saved user data modified by this report.

## Evidence and verification boundary
- Current connected tab: https://nerdeus-label-studio-production.up.railway.app/?template=master-cooked_meal&view=data&release=v13.9
- Production service observed online; Railway deployment 9442e306-9c53-4e1b-9b24-f498e6d45772 successful with no reported recent crashes or active warnings.
- Published code inspected: label-studio-deploy/index-v13_9.html (Git blob 5e217de184f97105a75f328ef278826abff0e44d); assets/master-label-v13_9.js (blob 7c4443ce7744cb205bd3389d46fcc96b41e302d1); assets/queue-v13_9.js (blob 5906ac89ed410d941136929d9660ee0cafd4f67e).
- Live connected tab reports v13.9 ready, 17 label types, 101 backgrounds, an active Cooked Meal master example, Ingredients family filter showing 3 entries, and BG-101 selected. It displays 14 checks for the default demo record, and Run editor checks says "Not tested in this session."
- No ability to physically click the connected browser's controls in this chat. No verified B1 Pro physical output; source-code defects are marked as confirmed by code, not as reproduced button clicks.
- External hardware context: NIIMBOT USA lists B1 Pro 300 DPI, 48 mm effective width, red/black dual-color output and 20–50 mm label widths; community device metadata describes modelId 4097, 576-pixel printhead. A NIIMBOT reseller lists 50x70 mm red/black labels compatible with B1 Pro, but physical print alignment, optical quality and long-term freezer durability still need validation.

## What is working in source
1. Canonical 17 type definitions across six logical families; previous designs are not automatically deleted.
2. 591 × 827 editable canvas and 576 × 827 print raster; exact black/red/white preflight and raw package-ID QR concept.
3. Type selection inside an existing package now prompts to start a separate blank package rather than silently modifying the current package.
4. Explicit type labels and package identity, 101 background selections, 123 cut illustrations, candidate artwork review gates.
5. Saved snapshots use binary PNG + SHA-256 in browser IndexedDB; drafts are distinguished from approved snapshots in the single-label workflow.
6. Batch now uses per-entry copies and source revision fingerprints, checks current-workspace duplicate IDs, and checks archived IDs during prepare.
7. Backup export and visible save failures; old browser storage is protected from an overwrite after a restoration exception.

## High-risk findings — implementation before wider use

### P0-01 Imported editable templates inherit review approvals
Evidence: index-v13_9.html -> LabelCore.validatedDoc copies every valid raw.data key to norm.data, including pkg.recordRole and review flags. importTemplate creates an editable document without explicitly resetting identityReviewed, quantityReviewed, storageReviewed, datesReviewed, allergensReviewed, artworkReviewed, textOnlyApproved, actionVerified or artStatus.
Risk: external/imported template JSON may be treated as an approved package if other validation requirements are satisfied. There is no trusted source/reviewer binding.
Fix: split "Import design" from "Import package data"; always import new packages as DRAFT with all source-dependent attestations reset, and require a fresh local review. Approved, immutable archive reprint should be a separate, checksum-verified operation.
Acceptance: import a synthetically reviewed package template; print and queue must remain blocked until new reviews. Historical approved snapshots remain immutable and unaffected.

### P0-02 Batch printing archives prior to print and without archive review schema
Evidence: assets/queue-v13_9.js -> doPrint saves saveRecord to IndexedDB BEFORE await driver.printPortraitCanvas. Its schema is nerdeus.print-snapshot.v1 and lacks printReview, whereas index-v13_9.html -> renderSnapshots/reprintSnapshot checks rec.printReview.approved.
Risk: failed print attempts may create archived entries and successfully driver-printed batch records can look unapproved and cannot follow normal reprint path. Single print is a separate modal path and does not consistently record job status.
Fix: unified LabelSnapshot (content+review) and PrintAttempt (requested/sent/driver result/physical verification) schemas. Create immutable validated snapshot before printing, but mark print outcome only after the driver returns; do not equate snapshot creation with printing. Preserve partial batch progress, attempt details and safe retries.
Acceptance: a failed second item in a mixed batch reports item one driver complete, item two failed, correct immutable snapshot links, and no silent claims of physically printed labels. Batch archive reprints through the same safeguards as single-label archive.

### P0-03 Type-specific safety and preparation information is not yet structurally enforced
Evidence: master-label-v13_9.js -> panel adapts explanatory field captions by type but largely collects generic pkg.attributes, pkg.contents and pkg.actionText; validate checks generic presence, length and reviewer flags. Dedicated cook/reheat temperature pairs, thaw estimate, marinade ingredient taxonomy, bread mix water/oil amounts and source-based evidence are not enforced per relevant type.
Risk: a reviewed-looking label may omit important information for its use case, and a generic "per recipe" text can pass checkbox-driven review. The 54-character Heritage footer is insufficient for multi-step instructions.
Fix: TypeDefinition schema with conditional required fields; use recipe evidence or deliberate manual verification; printed label can show concise instructions and QR points only to package ID for details in the app. Never fabricate target temperatures, dates or allergen absence. Separate "data recorded," "source checked" and "physical print verified."
Acceptance: required instructions exist for applicable categories; raw proteins with safety-critical cooking guidance cannot become print-ready on a placeholder alone. Bread mix has explicit additions and mass, marked reviewed; alternate types do not require irrelevant fields.

### P0-04 Saved-workspace recovery is incomplete
Evidence: index-v13_9.html -> loadLocal maps saved.templates through Core.validatedDoc under ONE outer try; one invalid document prevents loading the rest. restoreBlocked stops overwriting, good, but Workspace backup only exports data, and there is no workspace backup restore UI. saveLocal serializes the complete workspace on many inputs, with no durable revision trail.
Risk: one corrupt template can make every other saved template inaccessible in the app; user can export but not restore through UI.
Fix: per-document quarantine/salvage, validated backup importer with dry-run counts and diff, automatic safety-copy before migrations, storage size alerts, revisioned atomic snapshots, IndexedDB for artwork-heavy records and transactional state.
Acceptance: corrupt one of 89 templates in test fixture; valid 88 and local assets still restore; corrupt record is quarantined and downloadable; user can restore exported workspace without losing newer assets.

## Major UX / technical improvements

### P1-01 Active label versus browsing filter remains confusing
Live tab: active Complete Cooked Meal master, browsing filter Whole & Prepped Ingredients, three ingredient choices. New context text helps but still invites false inference.
Fix: separate "Current package" pinned card in main editor from "Browse a new label type" modal/drawer. Show selected type within each editor and Return to current; browsing does not silently move current object.

### P1-02 Default entrypoint remains a technical editor, not a package workflow
The user enters a master sample with 14 draft errors, while Design, Label data, Snapshots, Print setup, templates, art, layers and batch queue all compete for attention.
Fix: default start: Create package label / Open a saved package / Reprint snapshot / Design templates (advanced). Four main steps: Type -> Details -> Artwork -> Review/Print. Move legacy and layer tools behind advanced.

### P1-03 Master layout migration is not versioned tightly enough
isCurrentHeritageMaster checks layoutStyle='heritage-v13' and existence of second header, not an immutable template-version/signature. A saved old Heritage revision may override later improved defaults indefinitely.
Fix: published immutable master template versions + separate user customizations. Compare source revision, preview migration, archive previous revision only once and preserve field/userGeometry diffs. Migration tests across multiple release generations.

### P1-04 Approval status and action wording need one model
The static header says "Design mode" even with Label data view; top Print setup can open before record preflight; Save print snapshot can archive a draft; the stock checkbox conflates loaded stock with an accepted hardware test.
Fix: status machine DRAFT -> DATA REVIEWED -> READY FOR DRIVER TEST -> DRIVER COMPLETED -> PHYSICALLY VERIFIED. Show active status in header and next-step actions; separate "stock loaded" from post-print quality approval.

### P1-05 Current UI asks too much of users before basic identity
A generic validation panel reports 14 issues for demo data even before package creation. Date-event dropdowns expose all event kinds whether relevant or not.
Fix: do not run package-required validation on reusable examples; show progress by type and stage, validate touched fields on blur, review all safety requirements only before output. Apply type-specific event presets and avoid unneeded rows.

### P1-06 Large local updates and asset performance
saveLocal writes all templates and assets per editable keystroke; checkpoint captures full JSON workspace snapshots. Current gallery lists 101 backgrounds and 123 cut images, and rebuilds template list after food name edits.
Fix: debounce writes and use dirty-document changes; load images lazily only for the visible category, virtualize long galleries; track storage pressure, stage all changes in-memory and flush transactionally. QA with 100 and 1000 package records.

### P1-07 Background library quality and curation
The "Original Engraving 1...10" groups do not help find a relevant food theme, and active catalog includes BG-020 Homestyle Desserts, BG-056 Pastry Counter, BG-060 Fruit Parfaits, plus fruit/orchard motifs despite the no-dessert-background direction.
Fix: themed groups (Herbs, Grains/Breads, Savory Cooking, Smokehouse, Utensils, Woven/Butcher, Seasonal Comfort); status approved/candidate/retired; retire disallowed images for NEW selection without deleting legacy BG IDs or archived snapshots. Pixel-check all images and detect near-duplicates.

### P1-08 Artwork layer roles and composition remain too technical
Backgrounds are 540 × 215 region images, not complete 591 × 827 label backgrounds; "full-bleed" wording can imply otherwise. Two separate selectors (library and advanced master ornamental dropdown) expose 101 items and can confuse users.
Fix: explicitly distinguish decorative background, black/white food silhouette and full-label design layer; one selected preview with searchable categories, contextual recommendations, visible crop boundaries and safe text-overlay controls. Maintain pure three-color output.

### P1-09 Archives and queue lack operational management
Archive presents only the first 30 records and lacks filtering by package ID, type or date. Batch preparation loads all archived blobs to check IDs, and a print attempt does not store consistent per-item print lifecycle.
Fix: IndexedDB indexes/metadata-only query for ID, searchable archive, queued labels with item status and copies, retry specific failed print jobs and preserve exact snapshots.

### P2-01 JSON export/import direction
Record JSON can be imported in matching master context but cannot create a new local package with the SAME package ID if that ID already exists. This is correct for uniqueness but should explain "open existing" vs "create new package with new ID." Do not obscure conversions in a generic Import JSON control.

### P2-02 Make button intent match behavior
The template chooser's "+" tooltip says Duplicate template, but on a real package it creates a blank new package. Give separate "New package", "Duplicate contents into new package (new ID, reset reviews)", and "Duplicate design" actions.

### P2-03 Developer tools discoverability
SVG-to-bitmap converter exists at /tools/svg-converter, but the current editor lacks an obvious path to it. Add "Import/convert background" in advanced artwork, but keep casual user workflow focused.

### P2-04 Source traceability for actual Nerdeus Meals
The UX prototype records recipeRef and location as string fields but does not pull package data, ingredient-derived allergens, batch quantities, portion count or reheat method from Recipes/Cooking/Packaging. Continue mocking provider interfaces with explicit provenance; never pretend production integration is live.

## 17-type conditional schema proposal
- Raw plain: species/cut, cut state (bone/skin), weight, packed/frozen or other relevant events, cooking guidance source.
- Raw dry-seasoned: raw fields + seasoning ingredients, review of additional allergens, seasoned event.
- Raw marinated: raw fields + marinade contents and allergen review, marinated event.
- Whole ingredient: ingredient identity, quantity, purchase/pack/quality events.
- Prepped ingredient: prep form (diced/sliced/etc), amount, prepared/packed events.
- Ingredient combination: component names, quantities or composition, storage.
- Raw meal kit: components, quantities, assembly, actual verified cooking directions.
- Cooked meal: food name, cooked/packed/frozen events, servings, reheat instructions.
- Cooked side: component identity, quantity, prep/pack events, applicable reheat.
- Cooked component: prepped/used component, storage, use instructions.
- Leftovers: source meal, cooked date, new packing date, portions and storage.
- Soup/stew: container, mass or volume, dates and reheat.
- Sauce/stock/concentrate: volume/mass, concentrate/dilution instruction and events.
- Dry baking/meal mix: ingredient/allergen summary, dry net weight, liquid additions (water/oil), mixing/proofing notes as applicable, quality date.
- Seasoning/dry base: contents, measured dry weight, pack/quality dates, use instruction.
- Pantry ingredient: identity, dry net weight, packaging and quality date where applicable.
- Opened/ready to eat: exact product, opened event, handling/storage and use-by where grounded.
Keep all 17 canonical IDs; type variants and package status are fields, not new labels. All share 50 × 70 mm stock and equal-sized two-line header, but information placement is conditional.

## Target app information architecture
Landing: Create Package / Saved Packages / Reprint / Advanced Design.
New Package: family -> type -> derived data fields with progress -> art review -> preflight/output.
Saved Packages: searchable records, status, location, type, dates, QR ID, design version.
Advanced Design: asset/background library, layer editor, print-safe template tools, SVG converter.
Print/Archive: choose approved snapshots, select copies, verify stock, preview exactly, send print attempt; record driver result and separate physical QA.

## Acceptance tests before calling fixed
1. Current v13.9 tab: 17 canonical types, BG library 101, chosen family and currently edited object always distinguishable.
2. Existing package type switch cancel and confirm; no accidental data loss or reused package ID.
3. Import editable template with all review flags=1: must reset them and block print until fresh review.
4. Valid single package with real data -> archive -> print -> archive reprint with original image checksum.
5. Two-package mixed queue, three copies of one ID; simulate second package printer failure; snapshots and attempts remain consistent and resumable.
6. Invalid date sequence, missing cooking evidence, allergen uncertainty, wrong species artwork and invalid quantity pair all remain blocked when applicable.
7. All 17 types: relevant events/fields and no irrelevant mandatory dates.
8. Save >100 packages; reload; backup/export; corrupt one document and recover the others; restore from backup.
9. Repeated master migrations v13.7 -> v13.8 -> v13.9 -> future version keep customization and update published defaults.
10. Pixel-by-pixel 101 BG red/white validation, similarity/duplicate review, all 123 cut candidates approved or marked candidate, no prohibited artwork in new choices.
11. Phone/tablet/desktop keyboard-only, touch hover replacement, family browsing, guided create.
12. B1 Pro physical print on actual 50x70 dual-color stock: alignment, printhead crop, red plane, black plane, QR readability after freezer/moisture handling. No hardware acceptance without physical evidence.

## Printer and supply notes (external, independently sourced)
- NIIMBOT USA (https://niimbotusa.com/printers/b1-pro): B1 Pro 300 DPI, 48 mm effective print width, red/black dual-color printing.
- Community model registry (https://printers.niim.blue/hardware/models/): B1_PRO model ID 4097, 576-pixel head. This is community information, not firmware validation.
- NIIMBOT UK (https://www.niimbot.uk/products/nb815-niimbot-b1_pro-b2_pro-b21_pro-50x70mm-105-white-dual-colour-red-black-text-labels): compatible red-and-black 50x70 stock is listed; must confirm user stock SKU and print quality in practice.
- For long-term frozen food storage, test label adhesive and scan durability under condensation and abrasion. Direct thermal longevity is not guaranteed by a successful driver call.

## Defer backend implementation; mock now
Typed interfaces: LabelTypeDefinition, RecipeSource, PackageRecord (immutable globally unique ID), QuantityPair, AllergenEvidence (unknown vs reviewed), StorageEvent, HandlingGuidance, ArtworkAsset, TemplateRevision, PrintSnapshot, PrintAttempt/PhysicalVerification, WorkspaceBackup/Recovery. Introduce provenance fields, safety review invalidation and version IDs in the frontend mocks before server integration.

## Release recommendation
Do NOT change the 17 canonical type count or replace production visuals as a first step. First fix import approval security, unify print/snapshot/attempt logic and make per-type safety data explicit. Second make restoration recoverable and the create-package path primary. Third curate backgrounds and improve responsive UI. Then run real browser and physical printer acceptance. Keep all historical assets and saved layouts untouched until migration and QA pass.
