# Nerdeus Label Studio v13.9 — Workflow Corrections and Acceptance Specification
Date: 2026-11-03
Site: https://nerdeus-label-studio-production.up.railway.app/?template=master-cooked_meal&view=data&release=v13.9

## Release identity and verification
- Railway project d23d52cd-ba62-4f04-a6c5-00476d73a648, service 0a49ac30-6184-4a48-bf89-e4eec3bc5de8, production.
- Final v13.9 Railway deployment ID 9442e306-9c53-4e1b-9b24-f498e6d45772: SUCCESS / online, no reported crashes, critical warnings or deployment errors at the check.
- Pinned immutable source: `label-studio-deploy/index-v13_9.html` (Git blob `5e217de184f97105a75f328ef278826abff0e44d`), `assets/master-label-v13_9.js` (Git blob `7c4443ce7744cb205bd3389d46fcc96b41e302d1`), `assets/queue-v13_9.js` (Git blob `5906ac89ed410d941136929d9660ee0cafd4f67e`).
- Each inline JS block in HTML, both new modules: compile via `new Function`, syntax checks passed.
- Railway logs confirm source hash of the v13.9 HTML and new queue module, as well as the prior fixed background and cut libraries.
- **Not yet verified:** actual v13.9 browser clicks. The connected user tab was still displaying already-open v13.8 at time of final check. Browser access in chat supports reading a tab, not clicking it; the server readiness check is not a browser interaction test. Physical Niimbot B1 Pro output and QR scan also remain unverified.

## Corrections now in source
**F-01 Type selection / data loss:** Choosing a different type inside an existing `package-...` record presents an explicit confirmation for creating a **separate blank package**. Cancel leaves the package unchanged. The new package is created from its own canonical definition, not the prior package's data. Conversion of an existing package across types remains intentionally unavailable rather than silently losing fields.

**F-02 Reusable examples vs package instances:** The inspector explains whether the user is editing a reusable example or a saved package. A prominent `Create a NEW blank [type] package` action produces an instance with no demo ID or borrowed approvals. Single-print and print snapshot approval now require a real instance role. Mixed queue likewise refuses reusable master examples. Design examples can still be edited or exported as proofs; they are never silently treated as real packages.

**F-03/F-04 Label picker:** The six family filters show canonical types only; legacy copies do not appear in current-family lists. My packages and Legacy/custom are separate filters. The active package or design appears in its own persistent context element. The 17 canonical types are sorted according to the master definitions, keeping their family groupings intact. Type title is primary, example food name is secondary. Selecting within a family can keep that family filter.

**F-05 Identity:** Changes to the actual food name update the active item title, breadcrumb, type browser and package document name. Changing package ID updates the active identity context too.

**F-06 Contextual fields:** The main edit form provides type-specific labels for raw cut attributes, seasoned/marinated ingredients, kit/combination contents, dry mix water-and-oil instructions, use/dilution instructions, and cooked-food reheating guidance. This is UX guidance over the existing fields, not a full schema migration. The 17 types and current four-date-event model remain, with all user dates requiring explicit verification.

**F-07 Draft vs approved output:** Standard raster export explicitly says `Export proof PNG`, outputs a `-PROOF.png` name, and does not claim approval or physical printing. Existing three-color 591 × 827 render and 576 × 827 printer crop are preserved. Archives display `Data approved · physical print not verified` rather than implying hardware validation.

**F-08/F-09/F-18 Batch:** Adds package-role guard, editable per-item copy counts (1–50), same-ID duplication checks within queue and entire current saved workspace, and archived ID collision checks before batch ZIP/printing. The queue refreshes after saved edits and invalidates stale fingerprints. Fail closed if archive access cannot verify uniqueness.

**F-10 Package record imports:** The master import flow now accepts both `nerdeus.meals.package.v1` (source package JSON) and `nerdeus.package-label.v1` (`record()` queue export). It maps product, quantities, container, storage, allergens, handling and dated events to a separate new package, and resets review flags. Wrong-type records report that the matching type must be selected first; the current package is not overwritten.

**F-11/F-21 Storage recovery:** `Save template` feedback now indicates local save state, and a `Workspace backup` toolbar action exports both raw saved storage and current in-memory workspace as a JSON backup. If restoring the existing workspace throws, automatic overwrites are blocked and a persistent warning is shown. Quota/storage write failures are visible. **Note:** Per-document salvage from a partially corrupted workspace has not yet been implemented; recovery exports provide original bytes for later repair.

**F-12 Geometry:** Keyboard arrow nudges to Heritage layout elements now set `userGeometry`, as pointer and property edits already do, so subsequent derived-layout refreshes do not reset the intended position.

**F-14/F-15/F-22 UX:** Canonical type name precedes sample food name. Saved packages and reusable examples have different explanatory labels. On phone widths the package form is ordered above the artboard and large background library, which remains accessible.

**Existing v13.8 art recovery retained:** BG-001..BG-101 remain installed with stable IDs, master background layer identity, 123 available cut illustrations, locked fill/crop background application, 50 × 70 mm label profile, immutable saved PNG history. No prior saved designs or archived prints were intentionally cleared, recreated or merged.

## Manual browser acceptance checklist (MUST be verified before calling workflows complete)
1. Load a fresh v13.9 tab or hard-refresh; status must say v13.9, 17 types, and 101 backgrounds. Background thumbnails must visibly render.
2. Choose `17 reusable label types`: the 17 current canonical choices must be grouped by family, without any Previous layout entries. Family filter Raw proteins shows exactly three current raw types, not six with legacy copies.
3. Choose `Complete cooked meal`; verify reusable example is clearly labeled as such and the primary action creates a **new blank** cooked meal package.
4. Enter food name, package ID, weight pair, storage, dates and allergens. The displayed identity and label preview must update. Reload: contents persist, without switching back to an example.
5. On a package, change type via dropdown. Cancel: no change. Confirm: a different blank package opens, original remains in My packages, package ID is blank and all reviews reset. No old ID is copied.
6. Try adding a master example to batch: blocked. Add completed real packages of two different types: allowed after checks. Change a queued package field: queue status changes to Needs re-review.
7. Edit per-row copy count to 3, confirm queue total is 3 for that item and that re-adding uses the requested number, not +1.
8. Attempt duplicate package ID in another saved document or archive: batch ZIP/print is blocked with actionable error.
9. Export Record JSON from a package; import as a new package using matching type. Verify contents and event dates, ensure reviews are reset, and no existing package is overwritten.
10. Choose BG-013 then BG-101, switch type and back, reload. Background ID, master layer and preview must agree. No unrequested duplicate background layers.
11. Nudge an unlocked Heritage layer using arrow keys, edit a data field, and reload. Geometry must remain.
12. Force browser storage failure/quota error (safe isolated test context), confirm persistent warning; export raw Workspace backup. Never clear original localStorage as a repair.
13. On phone (<720px), package form appears before advanced artwork, with working touch background preview.
14. Run Editor checks and the 17-label raster QA; inspect failures and exact palette dimensions.
15. Physically test B1 Pro using actual 50 × 70 mm dual-color stock, verify orientation, red/black pixels, module quiet zone and package-ID-only QR scanning. No software test substitutes for physical acceptance.

## Outstanding / deferred
- The 17 types still use the existing shared data record and general four event slots. Per-type schemas, conditional required fields, source-backed temperatures, thaw information, water/oil calculations and provenance should be designed in the frontend lab and mocked before backend coding.
- Browser tests, click-to-apply background verification, mobile tests, localStorage/quota recovery, and physical B1 Pro test remain open.
- The 101 backgrounds still include previously rejected dessert/fruit themes. Audit and replace in a versioned library; DO NOT delete legacy ID references from existing saved designs without a compatibility mapping and approval.
- Full per-pixel inspection/duplicate-image hashing of every source artwork is not yet included in existing editor QA.
- Cross-device package ID uniqueness, cloud sync, recipe/meal inventory integration, allergen evidence, reviewed source dates, and print job acknowledgments require later backend work; continue mocking these in the UX workshop.

## Deferred backend contracts
`LabelTypeDefinition` (type, family, per-type fields and preflight rules); `LabelTemplateVersion` (versioned editable JSON/layout/art refs); `PackageRecord` (immutable unique ID, food data, storage and event dates); `AllergenEvidence` and `HandlingReview` (source, reviewer and invalidation); `ArtworkAsset` (strict color palette, SHA, dimensions, ID and approval); `LabelSnapshot` (immutable exact PNG, checksum and template/package revisions); `PrintBatch` and `PrintJob` (copied package IDs, print attempt and physical verification state); `LocalWorkspaceBackup` (versioned backup, migration, corruption recovery).

## Delivery boundary
This release fixes navigation, package creation/identification, most queue/record friction and safeguards in production source. It does not claim the old tab has refreshed, prove physical label printing, or validate data invented by demo defaults. Keep the legacy source and saved browser work intact.
