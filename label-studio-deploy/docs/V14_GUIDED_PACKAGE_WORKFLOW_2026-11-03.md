# Nerdeus Label Studio v14 — Guided package creation, recovery and shared print lifecycle
Date: November 3, 2026
Release: v14
Railway project: `d23d52cd-ba62-4f04-a6c5-00476d73a648`
Service: `0a49ac30-6184-4a48-bf89-e4eec3bc5de8`
Production deployment: `de3e0e9c-e75a-4a26-bf85-d74033909b60`, SUCCESS/online; zero active warnings, criticals or recent failures at check.

## Open
- Guided creation: https://nerdeus-label-studio-production.up.railway.app/?view=create&release=v14
- Existing advanced cooked-meal editor: https://nerdeus-label-studio-production.up.railway.app/?template=master-cooked_meal&view=data&release=v14
- Original production root now opens the guided landing when it has no explicit template or view. Existing design deep links keep advanced editor behavior.

## Source artifacts
- `label-studio-deploy/index-v14.html`: Git blob `eaf94e22223ce655a74cc60c9fd0d87748e9e963`; pinned to commit `92a69f4716bb452c54edd907d5c3df63795d5167`
- `label-studio-deploy/assets/master-label-v14.js`: Git blob `315e41284741746700e2c10b4f780d3fad2191ba`; pinned to commit `de9e4328ef60172b7d6aeb3a174145b2a53245ff`
- `label-studio-deploy/assets/queue-v14.js`: Git blob `5aa5a195f3070fdcddec6a5b2980c26bbdcb814e`; pinned to commit `bc3da113db271c19f51ea5e3d6db4f9f4181b68e`
- `label-studio-deploy/assets/workflow-v14.js`: Git blob `897b46c27d7053148461cd47fb73114828719236`; pinned to commit `f3e47ebc4e48982a164e8225d5ca7eba3712d75a`
- Railway Function checks Git blob SHA before serving; failures return 503 rather than unverified assets. Existing red/white BG-001..BG-101, 123 cut assets, legacy modules, archived snapshots and v13.9 files were preserved.

## Implemented UX
1. Guided landing: **Create Package Label**, **Open Saved Packages**, and **Advanced Designer**.
2. Four stages: **Type → Details → Artwork → Review and Output**; all 17 canonical type IDs and six families retained.
3. Dedicated new package creation uses `makeBlank`; no copied demo package ID, dates, quantities or reviewer flags. Existing package navigation remains separate.
4. Field collection: food identity; package ID; metric+imperial amount; storage; container; portions; physical condition; ingredient/contents; recorded allergens; printed handling text; four dated events. No auto-use-by or guessed food temperatures.
5. Conditional requirements by type:
   - Raw proteins require protein/species, cut/form, and source of cooking directions.
   - Seasoned and marinated proteins require actual added ingredients.
   - Prepped ingredient records require preparation method.
   - Raw kits and cooked food with applicable handling require source documentation.
   - Leftovers identify original cooked food.
   - Sauce/stock concentrates record dilution/use guidance.
   - Dry baking mixes require real water and oil additions with measurable units.
   - Type-specific preparation event dates are required where appropriate: seasoned, marinated, prepped, assembled, cooked, blended or opened.
6. Artwork step keeps decorative red backgrounds independent of black/white food silhouettes, with draft preview and explicit review.
7. New guided selection excludes dessert/pastry/fruit-only backgrounds from NEW choices; it does not delete BG IDs or artwork already used in saved labels. Advanced designer retains all 101 for compatibility.
8. Review step provides explicit manual confirmations. Pending validation issues are displayed; Print and Add to Batch are disabled until the shared preflight passes.
9. Advanced label editor remains accessible; direct links and master design editing remain available.

## Safe imports and recovery
- General editable JSON design import is now always an **unreviewed design**, not a ready-to-print package; original sample package ID is cleared and approval fields reset.
- Existing Nerdeus Meals / Label Studio package record imports create new unreviewed package records; type-specific fields survive record export/import.
- Export Workspace backup remains available.
- Restore Backup imports a backup as additional unreviewed drafts after explicit confirmation. Existing labels are not silently replaced; package-ID collisions are cleared in the recovered copy.
- A per-document salvage loop restores readable documents even if another stored template fails validation. The original raw workspace is not automatically overwritten on partial restore.
- Recover Readable Labels requires confirmation and writes a separate raw safety copy before accepting the readable records.
- Browser quota and restore failures block safe print preflight and are displayed to users.
- This is still **local browser storage**, not cloud backup; cross-device sync and global package-ID uniqueness are later backend requirements.

## Shared preflight / snapshot / printing
- `window.LabelPrintLifecycleV14` is a common frontend boundary.
- `preflight(doc)` checks real package role, type-specific `LabelMasterV9.validate`, duplicate IDs in the workspace and archived records, artwork decode, 591×827 exact palette and 576×827 printer raster, and blocking layout warnings.
- Single snapshots use `nerdeus.print-snapshot.v2` with immutable PNG bytes, SHA-256, current template/package data, and approval issues. Draft snapshots remain drafts.
- Single B1 Pro printing and mixed-label batch printing use `printOne()`, creating an approved snapshot before sending a printer request; actual printer attempts are stored separately in IndexedDB `nerdeus-label-print-attempts-v14`.
- Each attempt has its own request ID, snapshot ID, package ID, printer model, density, stock, driver status and `physicalVerification:'not_verified'`. Failures are recorded without overwriting prior successful attempt records.
- Mixed queues retain copy counts and stop at a failed item/copy, reporting the count completed according to the driver.
- Archived reprints retain checksum and original approval requirements; they do not silently re-render changed designs.
- A **driver-completed** attempt is not a physically verified paper label or QR scan. An actual B1 Pro and appropriate red/black thermal stock are required for final acceptance.

## Verified in this release
- All inline HTML scripts, master v14 module, mixed queue v14 module and guided workflow v14 module passed JavaScript syntax checks.
- Headless, mocked-DOM module checks created all **17 of 17** canonical `makeBlank` packages without copied package IDs or food illustrations.
- With synthetic test values and manually populated review flags, all **17 of 17** canonical types returned no `validate()` issues in an isolated logic test. This test does not prove authenticity of food facts or printed output.
- Latest Railway Function source pins verified SHA hashes for all four v14 files; production deployment SUCCESS and zero active service warnings/crashes in the observed check.
- Railway logs confirm HTML, queue and guided workflow modules passed SHA verification.
- **Not verified:** actual human browser clicks, form persistence across live user-tab reload, phone/touch UI, Bluetooth connection, real paper color/registration, QR scan, freezer label durability. The connected tab remained on v13.9 at the time of this check. A deployed code file does not by itself establish actual browser operation.

## Browser acceptance tests remaining
1. Open new guided link. Confirm v14 appears, choose each family and representative type, create real package without modifying the default example.
2. Enter a package ID, real weight pair, ingredients and date events; reload. Confirm all fields persist.
3. Try raw protein without species/cut/cook-source, seasoned protein without contents, opened product without opening date, and dry bread mix without water/oil. Review and printer actions should stay blocked.
4. Review fields in each relevant category, choose text-only or food image, and test exact palette preview.
5. Import a deliberately reviewed v13 package-design JSON: confirm safety approvals are reset and label remains draft.
6. Export backup, import into another clean browser, recover valid documents while preserving the original data and resetting approvals; test a corrupted-template case.
7. Switch BG-013 ↔ BG-101, save and reload; food silhouette truthfulness and background artwork remain separate.
8. Add two different types to a queue, change a queued package, inspect invalidation; set copies; simulate second print failure and verify per-attempt persistence.
9. Save and reprint immutable archived snapshot; verify SHA, 591 × 827 art and 576 × 827 centered crop.
10. On B1 Pro with physical 50×70 dual-color stock verify red/black planes, 7/8 px centered crop, QR package-ID payload, print quality after freezer/condensation handling.

## Deferred backend requirements
Continue UX-first mock data; do not wire live backend until types and acceptance criteria are agreed. Required contracts:
- `LabelTypeDefinition` per-type fields, validation and event chronology.
- `PackageRecord` globally unique package ID, recipe/batch/quantity associations, storage events, provenance and review invalidation.
- `AllergenEvidence` explicit unknown/reviewed distinction.
- `HandlingGuidance` source-backed cook/reheat/mixture requirements; do not infer targets.
- `ArtworkAsset` stable BG and food silhouette IDs, palette, checksums, approval and deprecated state.
- `LabelTemplateRevision` stable master version and separately stored user modifications.
- `PrintSnapshot` immutable PNG bytes, checksum and approval provenance.
- `PrintAttempt` printer, stock, density, attempt status, receipt/timeout, and physical QA.
- `WorkspaceBackup/Restore` transactional snapshots, merge conflicts and per-document quarantine.
- `PantryRecipePackagingAdapter` read-only imported/source data, never falsely advertised as live syncing.

## Future work
Finish actual browser-level automated tests, type-aware printed layout presentation (current structured fields are often record-only), optional automated assistance for water/oil print line from confirmed values, semantic artwork curation of all 101 backgrounds, and mobile/keyboard accessibility verification. Maintain exact three-color imaging and 50×70 mm B1 Pro profile.
