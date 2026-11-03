# Nerdeus Label Studio v14.3 — Workflow audit and production update
Date: 2026-11-03
Production: https://nerdeus-label-studio-production.up.railway.app/?view=create&release=v14.3
Advanced: https://nerdeus-label-studio-production.up.railway.app/?template=master-cooked_meal&view=data&release=v14.3

## Status and source
- Railway project `d23d52cd-ba62-4f04-a6c5-00476d73a648`, service `0a49ac30-6184-4a48-bf89-e4eec3bc5de8`, production environment `8dfd8487-0055-43f3-b59f-13bdc425ae6d`.
- Production deployment `dadb23d2-5796-4225-b00e-1d1ec373a7e3`: Railway status SUCCESS/online, zero recent reported deployment failures or active service issues at check.
- New page `label-studio-deploy/index-v14_3.html`, immutable Git blob `e797d108d66d6c6e023e0c85fab1013413342afb`, creation commit `08b3755b153506464da759136cc7f067b4c4dcfc`.
- New guided module `label-studio-deploy/assets/workflow-v14_3.js`, Git blob `a37881edce6b64c7d4937c4dd35df9fbb1934f23`, commit `a360c4d193c875119bbf1ea9d0a5c5949a7b7b5f`.
- New mixed queue `label-studio-deploy/assets/queue-v14_3.js`, Git blob `1e83b188f27b7a786184bdb8706cf33528ac15bc`, commit `c92b05c9bd4a82f1e85d023fcdb63f137e6d85db`.
- Existing master design `assets/master-label-v14_1.js` remains pinned and unchanged, as do previous layouts, 17 canonical types, 101 backgrounds, 123 cut illustrations, local package records, printer dimensions and archived snapshots. No user storage was deleted or reset.

## Audit findings confirmed from source
### A1: Review actions could be enabled before validation completed (high priority)
The v14.2 review markup rendered both Add to batch and Printer setup enabled; `preflight()` was async. On preflight failure, error text was shown but the controls were not reliably disabled. In addition, direct action handlers could reject with an uncaught promise and look inert.

**v14.3 fix:** render review output controls disabled initially, hold them disabled while preflight runs, enable only when the current package passes, and fail closed on preflight exception. Output handlers separately revalidate and catch/report errors. A busy guard prevents duplicate output requests.

### A2: Guided queue could claim an action without a confirmed addition (high priority)
v14.2 called `window.LabelQueueV9?.add?.()` but did not inspect success/failure. Users could read a generic "queue action requested" even if the module was missing, the batch limit was exceeded, the package had been edited or localStorage failed.

**v14.3 fix:** `add()` now returns `{ok,message}`; actual additions and copy changes must persist first. When persistence fails, the queue restores the previous entries in memory and reports no confirmed addition. Queue validation blocks incomplete packages. Existing queued items can update copies even at the 30-distinct-package limit. Guided UX reports the returned acknowledgement and includes a **View existing batch** navigation action.

### A3: Draft package completion was hard to see (medium priority)
The guided detail editor had conditional fields but no compact summary of how far basic entry had progressed before final Review.

**v14.3 fix:** an inline indicator shows six categories of recorded facts (food name, formatted package ID, entered quantities, storage/container, instruction, dated event). It updates after field changes, lists up to two missing basic items, and explicitly does **not** mean that measurements, allergens, source cooking guidance or physical output have been verified.

### A4: Missing guided module could leave a dead button (medium priority)
The app depends on a versioned guided module loaded after the main HTML. The prior version's Create package label button could appear inert if that module failed to initialize.

**v14.3 fix:** a load-time guard checks the connected guided module and provides an explicit warning plus a link-like fallback behavior that scrolls to the advanced template chooser. It does not conceal module failures or claim the guided UI is working.

## Tests executed during current update
1. New HTML: 12 inline JS script blocks compiled successfully.
2. v14.3 wizard and mixed queue modules: standalone JavaScript syntax compilation passed.
3. Isolated guided-flow simulation: six of six checks passed:
   - create a real package,
   - fail-closed behavior after a preflight exception,
   - enabling output controls only after successful preflight,
   - visible rejected-queue response,
   - visible confirmed-queue response,
   - simulated printer setup action opens once.
4. Isolated queue module tests: three of three passed:
   - successful queue add returns a positive acknowledgement with requested copy count,
   - failed browser storage rolls back the queue and returns a negative acknowledgement,
   - incomplete package review prevents queue entry.
5. Railway function is updated and live; production deploy succeeded.

### Verification limitations
The connected Browser integration supports reading the current open tab but not clicking it or reloading the user’s session. The tab had v14.2 displayed before the deployment and was not reloaded by the assistant. Therefore **real v14.3 clicks, browser persistence/reload, phone interaction and actual B1 Pro printing remain unverified**. GitHub Actions Chromium workflow from v14.1 previously failed before job steps ran; those runs are not evidence of successful browser tests. Only a controllable fresh browser can complete live UI acceptance.

## Manual acceptance steps
1. Open the v14.3 guided URL in a new tab or hard-refresh the old tab. Confirm `v14.3 · Label editor ready`.
2. Choose label type. It must open a new, separately identified package with typed fields and immediately show the editable Details step.
3. Enter one field and move focus out of it. Verify the basic-facts progress display updates; note it is only a record-completion indicator.
4. Navigate to Review while requirements are incomplete. Verify Add to batch and Printer setup start disabled and remain disabled until all shared checks pass.
5. Check actually verified data and artwork, and provide applicable dates/instructions; when software preflight passes, the controls become enabled.
6. Add to batch. Verify the receipt explicitly says the package was added and the correct copy count. Select View existing batch and inspect the entry.
7. Simulate a storage failure in a disposable profile: no success confirmation is allowed, and the queue must not silently retain unpersisted additions.
8. Test an unavailable module or a deliberately rejected preflight: show a visible error, not an unresponsive button.
9. Verify 591×827 artwork and 576×827 exact three-color hardware raster, then test the actual B1 Pro and label stock separately. Do not claim physical output success from a driver response.

## Deferred backend and frontend requirements
- Versioned `PackageRecord`, `LabelTypeDefinition`, `TemplateRevision`, `ArtworkAsset`, `PrintSnapshot` and `PrintAttempt` contracts.
- Explicit safety source provenance (recipe, ingredient/allergen review, handling/cooking directions) and invalidation on relevant edits; **never invent temperature, thaw time or use-by date**.
- Global package-ID uniqueness with immutable historical print snapshots, rather than browser-only collision detection.
- Recoverable, transactional storage to avoid full-workspace localStorage writes for every field and to support multi-device history.
- Background collection curation and per-image palette uniqueness, while preserving archived BG asset IDs.
- Better per-type validation guidance next to the fields and more accessible details navigation on mobile; maintain one standard label size and equal-prominence measurement units.
- Actual Chromium browser acceptance and physical freezer/condensation/QR scanner testing.

## Release boundaries
This release is a frontend UX and browser-local mock workflow improvement. It does not implement cloud persistence, backend recipe/pantry integration, new physical printer certification or new label types. Existing packaging artwork and all previously saved user documents remain unchanged by the deployment.
