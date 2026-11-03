# Nerdeus Label Studio — End-to-end UX workflow audit (v13.8)
Date: November 3, 2026
Scope: frontend UX, saved browser-local data, template/type selection, artwork, output, batch, print safeguards, testability. Defer external services/backend code. Preserve production and prior layouts until fixes are independently verified.

## Evidence and limits
- Production URL: https://nerdeus-label-studio-production.up.railway.app/?template=master-cooked_meal&view=data&release=v13.8
- GitHub app: `label-studio-deploy/index-v13_8.html` (Git blob `2d70b6b4d61633e02dbfbb4c5e87f494d3e08298`).
- Master types/form: `label-studio-deploy/assets/master-label-v13_8.js` (Git blob `d766f51ecd76f6378f4bd5884f586b56caf8cc9f`).
- Queue: `label-studio-deploy/assets/queue-v9.js` (Git blob `0e7e696080b93fe78665a00d435751dd225102ad`).
- Legacy package forms: `label-studio-deploy/assets/package-labels-v8.js` (Git blob `6a5654e57490831999cece74eee7074a313a6143`).
- Railway production deployment `296e76ed-b4af-4c0d-b81e-3f10fa91bc8a` was SUCCESS/online at audit; no active Railway warnings observed.
- Connected browser tab displayed ready status, 17 canonical label types, 101 backgrounds, active Cooked Meal master, filter Raw proteins, and six of 89 templates (including three preserved previous layouts).
- The accessible browser tool can read page content but cannot click user controls. Dynamic click results, reload persistence, touchscreen behavior, physical Bluetooth printing and printed QR scan were **not** verified. Source-derived defect claims below are code-path findings, not asserted completed browser reproductions.

## Recommended information architecture (highest-priority decision)
Three distinct resources, never disguised as the same selection:
1. **Type definition**: the immutable canonical category (17 IDs). Controls requirements/default layout.
2. **Reusable visual template**: a versioned editable design for one type, with optional theme, backgrounds and components; not a real labeled food package.
3. **Package record**: instance holding actual food facts, package ID, dates, quantities, reviewed instructions, allergens, associated template revision, and frozen print snapshot.
User-facing primary action: **Create package label**. Secondary actions: **Find/reprint an existing package**, **Edit a reusable template** (advanced).

Preferred flow:
Choose goal -> select family -> select 1 of 17 types -> create/load package -> enter conditional facts -> choose/review artwork -> preflight -> preview exact output -> print/export proof or approved snapshot -> archive/reprint.
Changing decorative design must not change type or package. Changing type is an explicit migration with a field-impact review, never a silent jump to another master's sample.

## Canonical 17 types (keep count, clarify presentation)
Raw proteins: raw_plain (Plain raw protein), raw_seasoned (Dry-seasoned raw protein), raw_marinated (Marinated raw protein).
Ingredients: ingredient_single (Whole/single ingredient), ingredient_prepped (Prepped single ingredient), ingredient_combo (Ingredient combination).
Meal kits: raw_meal_kit.
Cooked food: cooked_meal, cooked_side, cooked_component, leftovers.
Wet food: soup_stew, sauce_stock_concentrate.
Dry/opened: dry_baking_mix, seasoning_dry_base, pantry_ingredient, opened_ready_to_eat.
Six families are sufficient; consolidate duplicate and previous designs in the advanced library, not the canonical type chooser.

## Findings — source-confirmed (codes for implementation tickets)

### P0 (resolve before broad use)
**F-01 Type change silently changes the active document.**
Master form's `#masterLabelType.onchange` calls `setActive('master-'+selected)`. When used inside an individual `package-...` record, the user is moved into a different reusable master example, not a converted package. This persists the old package without explaining what happened. Fix: when choosing a new type, offer (A) start a separate package (default), (B) explicitly convert current package with a preview of incompatible fields, or (C) cancel. Never mutate type through a generic dropdown while editing a package.

**F-02 Masters and real packages share editing/printing affordances.**
The master example's `pkg.*` data are editable directly; the queue accepts any `M.isMaster(doc)` (including master example IDs) after review, while the primary 'Save template' action saves the whole workspace. Fix: lock canonical sample data as read-only default previews for ordinary package users; prominent 'Create a label from this type' CTA; reserve 'Edit master' for design mode. Enforce `recordRole==='package'` in print paths (or explicit copy/convert).

### P1 (next sprint)
**F-03 Type browser shows other browsing context with no active context notice.**
Live: Cooked Meal document with Raw proteins filter; no prominent separate browsing vs active distinction. Fix a persistent active package/type breadcrumb and highlighted selected type, with a 'Return to current label' control. Selection of family filters should not imply it changed current type.

**F-04 Legacy layouts mix into family filters.**
`renderTemplates` filters `family:*` solely by `family(doc)`, without excluding `legacyMaster(doc)`; the live Raw proteins list shows three current plus three saved previous layouts. Fix: family chooser only current canonical types; 'My packages' and 'Legacy/custom' as explicit separate tabs. Keep access to previous designs.

**F-05 Names and titles do not update coherently while typing.**
Master form field input updates data and artwork but does not call `renderTemplates()`, or sync the main template title/breadcrumb until a later `refresh()`. Fix: update only name labels/breadcrumb reactively, without rerendering the form or disturbing input focus.

**F-06 Shared generic form ignores key type differences.**
17 types use almost the same fields with generic four date-event rows; validation is primarily common and only requires contents for kits/combinations. Add an explicit per-type schema of required/optional facts and output priority. Examples:
- raw whole cut: protein/cut, bone/skin descriptor, weight, source dates, verified cook guidance and thaw when relevant;
- dry seasoned/marinated: actual seasoning/marinade components, allergen review, event type/date;
- raw kit: component inventory, preparation and handling;
- cooked meal/side/component/leftovers: cook/pack dates, servings, storage and verified applicable reheat directions;
- soups/stocks/concentrates: mass or volume, dilution/use notes;
- dry bread/pizza/flatbread mix: water/oil additions, mix/yeast details, allergens, best-quality;
- opened products: opened date and use-by/quality-by as applicable.
No fabricated shelf life, temperatures or allergen assurances; source/mode flags needed for later integration.

**F-07 Print-vs-proof distinction is weak.**
Ordinary PNG export checks strict palette, not all package-review data, and is offered on examples/drafts. A draft indication may be included in the rendered design, but the action label does not communicate approval. Provide 'Export draft proof' for incomplete data and separate 'Export print-approved PNG' after exactly the same gate as print/snapshot. Avoid false claims of verification.

**F-08 Batch package IDs are not globally/locally complete.**
The queue checks duplicate IDs among queued items and format via `M.validate()`, but batch `prepare()` does not perform the single-label workflow's workspace-wide and archived-ID collision checks. Align preflight before ZIP and print, with server-level uniqueness deferred. For archived reprints preserve same ID intentionally.

**F-09 Queue display becomes stale after edits.**
The queue stores a fingerprint and blocks changed source docs on `prepare()`, but the editor's ordinary save/edit code does not re-render queue status immediately. Add a state-change subscription invalidation and 'Needs re-review' status with one-click remove/re-add, while retaining explicit confirmation.

**F-10 JSON record export/import are incompatible without an adapter.**
Queue's `record(doc)` exports `schemaVersion:'nerdeus.package-label.v1'` and `labelType`, while the master form's Import Nerdeus Meals package record expects `schema:'nerdeus.meals.package.v1'`, `type`, and a different event structure. These can be separate contracts, but UI must label their direction and supply a tested adapter for roundtrip/transfer, or omit a misleading implied import/export symmetry.

**F-11 Browser storage failure is underprotected.**
`saveLocal()` writes the entire templates array on many keystrokes and silently leaves user in a 'not available' state when quota/storage fails. `loadLocal()` validates all stored documents in one `map()` inside a single outer `try`; one bad doc can prevent restoring other saved docs (though raw storage isn't deliberately erased). Add per-document isolation, read-only recovery/export, persistent save failure banner, quota estimates, and versioned backups. Never clear user storage as a repair.

**F-12 Keyboard position changes can be reset by derived master layout.**
Pointer and numeric inspector changes set `userGeometry` for Heritage masters; keyboard arrow handler mutates `e.x/e.y` without marking `e.userGeometry`. A later data field `derived()` may reset the nudge. Standardize position updates and add a test: nudge -> data edit -> reload -> geometry unchanged.

**F-13 Approved artwork QA is incomplete.**
The v13.8 'Run editor checks' confirms 101 IDs and syntactically valid PNG data URIs, but does not inspect every image's exact red/white pixels or hash duplicates and has only limited simulated BG switching. Add full pixel classification, unique image SHA/perceptual similarity review, 540x215 source-size check, exact output raster check, 17-type coverage, and browser-level click/change/persistence tests. Keep print hardware acceptance separate.

### P2 (UX and maintenance)
**F-14 Name-oriented type list obscures types.** Current items lead with example names (e.g., Ribeye Steak), with 'Plain raw protein · Example' in smaller text. Reverse hierarchy: 'Plain raw protein' headline, example below; include simple one-line description and type-specific info preview.
**F-15 Generic warning volume burdens novice users.** Master gate can show 14+ errors before entering any data. Make step-specific progress, summary count, field-level inline errors on blur/continue, and show all technical preflight warnings only in Review.
**F-16 Separate pieces of art need distinct controls.** Make 'Red decorative background' and 'Food-only silhouette' different tabs, with selected BG ID/thumbnail/fit mode, and a clear full-size preview (hover, focus, touch). Use 'Add second artwork region' only in advanced editor.
**F-17 Asset curation not aligned with accepted use cases.** Live active 101 includes BG-020 Homestyle Desserts, BG-056 Pastry Counter, BG-060 Fruit Parfaits, and orchard/fruit motifs. Audit against approved Nerdeus Meals food-storage themes and the explicit no-dessert-background decision; mark unsuitable options inactive in new choices but retain compatibility with saved documents. Replace Original Engraving 1–10 grouping with clear culinary themes; audit similar artwork.
**F-18 Copies entry behaves unexpectedly for existing queue item.** `add()` increments existing entry by one, ignoring the Copies field. Show editable per-item copies; update on each edit; explicit quantity caps.
**F-19 Archived snapshot retrieval is basic.** Archive previews first 30, no search by package ID/type/date or recovery UI for archived template metadata. Add filter, sort, pagination and safe restore-as-new from archived template, without changing immutable raster bytes.
**F-20 Snapshot/reprint trust wording.** Current UI says 'Print-ready at archive' and has an explicit printer model gate, but no physical color/QR evidence. Label it 'Approved for driver test' until physical validation is recorded, preserving the immutable original PNG.
**F-21 Automatic save and 'Save template' conflict.** Offer persistent 'All changes saved locally' state and distinguish 'Save package', 'Save design version', 'Archive exact print snapshot'. Save failures should stop the user from assuming persistence.
**F-22 Mobile hierarchy still burdens package workflows.** Mobile shows left template/art panels before the right-hand data form in DOM order. Place type/package identity and form first in mobile package mode; collapse artwork library behind button; sticky compact package preview and validation footer. Preserve full design editor via explicit advanced tab.

## Workflow-by-workflow target acceptance
| Workflow | Current status | Acceptance condition |
|---|---|---|
| Landing/select action | mixed intent | New package, existing/reprint, edit design distinct |
| Select type | confusing; F-01/F-03/F-04 | 17 clear types; active type vs filter distinct; no data switch |
| Create instance | exists; F-02 | actual package gets unique app document ID, sample master unchanged |
| Edit identity | works with stale titles F-05 | live label + list + breadcrumb synchronized |
| Quantities/servings | validation exists | type-aware units, two-unit check, assisted conversions, no fabrication |
| Dates/storage | four events and chronology check | relevant event labels per type, correct chronological checks |
| Safety/allergens | review checkboxes exist | conditional checks, evidence/provenance, never 'allergen-free' inferred |
| Backgrounds | 101 active; F-13/F-17 | curated exact-red/white unique images, safe BG persistence |
| Food artwork | 123 cuts, mostly candidate | truthful food-only, separately verified from red background |
| Design/layers | full editor exists; F-12 | pointer/keyboard/numeric geometry persist together |
| Save/reload | localStorage; F-11/F-21 | recoverable revision, quota signaling, deterministic reload |
| JSON import/export | incompatible contracts F-10 | named directional formats with adapter tests |
| Draft PNG/SVG | possible; F-07 | clearly distinguished proof vs approved print |
| Snapshot archive | immutable saved blobs, F-19/F-20 | searchable immutable records + optional restore-as-new |
| Mixed batch | 30 distinct/50 copies, F-08/F-09/F-18 | duplicates, revisions, copies and status consistent |
| Single print | experimental B1 Pro | driver model/stock gate + physical acceptance recorded |
| Batch print | experimental | no duplicate IDs, no unreviewed labels, safe partial-failure UX |
| Tests/diagnostics | synthetic/limited F-13 | real click paths, 17 types, mobile, print rasters and negative tests |

## Target screens / navigation
1. **Label dashboard**: primary 'Create package label', secondary 'Find/reprint', advanced 'Manage templates'; show drafts and ready packages.
2. **Type picker**: six tabs/families, 17 type cards with explanatory examples. No legacy copies in this picker. Focus stays on current creation task.
3. **Package editor**: persistent type badge, editable food name, labeled steps; summary of package ID, storage, quantities and status visible. Draft/save status distinct from ready-to-print.
4. **Artwork tab**: selected decorative red BG + reviewed black/white food silhouette; show all themes and preview; preserve master layout; do not silently autoapprove.
5. **Review/preflight**: missing fields grouped by step, screenshot-equivalent output preview in 591x827 and 576x827; classify palette, crop, QR modules; clearly draft or ready.
6. **Print/batch**: queue summary with editable copies and revisions, final preflight, printer model and stock checks, explicit print confirmation, partial print state per package.
7. **History**: searchable immutable snapshots and job attempts; exact reprint vs new copy made explicit.

## Mock data and deferred backend contracts
No cloud integration needed for current UX; mock the following interfaces and document dependencies:
- `LabelTypeDefinition`: stable ID, family, state, printed field priority, conditional required fields, date-event rules, permitted storage/actions, recommended artwork taxonomy.
- `LabelTemplateVersion`: unique template/version, type, source JSON, approved status and immutable parent, change history; separate canonical default and user custom variants.
- `PackageRecord`: globally unique package ID; food/cut/components; source recipe or pantry references; mass/volume; event dates; storage; container; provenance; conditional instructions.
- `AllergenAssessment`: typed allergen set, evidence source, unknown vs reviewed-blank, reviewer/time; never infer absence from missing data.
- `ArtworkAsset`: BG ID, SHA and palette, dimensions, category, approval status; icon asset and species/cut provenance; replacement compatibility.
- `ReviewEvidence`: separate identity, quantity, dates, storage, allergens, cooking/handling and artwork confirmations, timestamps, invalidation on relevant edits.
- `LabelSnapshot`: frozen exact PNG, SHA, source template revision, package data revision, print profile, created/approved timestamps, reprint lineage.
- `PrintBatch/PrintJob`: per-entry copies, print state, attempts, printer model, calibrated label stock, driver receipt, physical/scanner verification status.
- `LocalWorkspaceRecovery`: schema migrations idempotent, per-document validation, export/recovery even after one invalid item; server sync later, never pretend server uniqueness today.

## Test matrix (must execute, not just simulate)
- Every canonical type: choose -> blank package -> fill valid data -> review -> draft/ready preview -> save -> reload -> package type unchanged.
- All six family filters: current types only, selected type shown distinctly, legacy isolated, search/keyboard navigation.
- Package type change: explicit new/convert/cancel; verify fields, package ID and batch not silently replaced.
- 101 BGs: each decode at 540x215, only #FF0000/#FFFFFF, hash similarity audit; click apply + inspect + reload on three samples (BG-013, BG-101, random).
- Food image candidate: species/cut mismatch blocked; no automatic safety signoff.
- Geometry pointer, keyboard, and numeric -> save -> field changes -> reload persistence.
- Invalid units, end-before-prepare, contradictory state, missing/unknown allergens, invalid package ID, incomplete cooking instructions; no print/ready bypass.
- Record export then import via adapter; wrong schema yields actionable conversion message.
- Batch: different types, duplicate ID in nonqueued template/archive, changed queued item, 1 and 50 copies, over limit, partial print failure.
- Browser persistence: quota exhausted, one corrupted stored template, first load, reload twice, migration with old 17 layouts, no accidental deletion.
- Phone widths, touch previews and navigation, desktop 4K/1440, keyboard-only and zoom.
- Exact PNG and printer raster and 300 DPI metadata; independent physical test on confirmed NIIMBOT B1 Pro and actual dual-color stock, scan QR with package-ID-only payload.

## Build order
1. **Selection and document model**: F-01..F-06 and F-21 — highest user confusion/risk, focus on type vs package vs design.
2. **Save, validation and printing**: F-07..F-12, F-18; unify preflight across single, batch, snapshot, export.
3. **Artwork quality and mobile**: F-13..F-17, F-22, while preserving approved visual style.
4. **History, real-browser regression, printer acceptance**: F-19/F-20 and complete matrix.
No production deployment or saved-data deletion is authorized by this audit document itself.
