# Label Studio v13.6 — background library and 123-cut startup recovery

**Date:** November 3, 2026  
**Live editor:** https://nerdeus-label-studio-production.up.railway.app/?template=master-cooked_meal&view=data&release=v13.6  
**Railway deployment:** `660cc3cb-6bd0-46ab-afe7-77d84d6e5087` (SUCCESS; no reported service failures/warnings)  
**Pinned page commit:** `06e9fe3bf6c55b22505c0317d0303cd06a3dd5a1`  
**Pinned index:** `label-studio-deploy/index-v13_6.html`, Git blob `374a57c880a5a568248457d7650129f173b57c77`.

## Incident

On the live v13.5 user tab the error banner stated `Uncaught TypeError: Cannot read properties of undefined (reading 'toUpperCase')`. The editor showed 0 layers and empty selectable content. HTTP 200 and Railway's SUCCESS state were insufficient to establish a working browser application.

Root cause: the original Cut Library holds 14 starter cuts with a legacy subtitle, default red background and cooking note. `cuts-123-extended.js` appends **109 artwork-only candidates** without `subtitle`, `patternId`, or `cookTarget`. The original `Cuts.initialTemplates()` used `assets.map(makeTemplate)`; because the extension appended to the same mutable `assets` catalog, it attempted to build 123 standalone cut templates. `asset.subtitle.toUpperCase()` threw on the first extended candidate while evaluating default templates in the editor's top-level script. The later queue's `requires initialized ... master editor` error was a consequence of the earlier failed initialization, not the root cause.

Separate UX cause: the v13 focused-mode rule `.nls-focused .nls-background-library{display:none!important}` hid the background gallery and filters for the user's current master-label workflow.

## Remediation

1. Changed `Cut Library.initialTemplates()` to build the **original 14** templates only using `assets.slice(0,14).map(makeTemplate)`. All 109 new illustrations remain in the searchable `LabelCuts.catalog`, available for new cut labels and master artwork selection. No approved assets removed.
2. Hardened `Cuts.makeTemplate(asset)` against absent legacy fields. Species/name/subtitle use safe string conversion; absent default background uses `BG-101`; absent cooking note uses `VERIFY COOKING INSTRUCTIONS` rather than an invented safety temperature.
3. Removed only `.nls-focused .nls-background-library` from the focus-mode hide selector. Advanced cut-art and low-level layer controls remain collapsible, while the background search, groups, thumbnails, and Apply interaction stay visible.
4. Kept the master-label v13.3 source, 17 template family definitions, existing browser storage, red/black/white render pipeline, 50 × 70 mm stock profile, cut artwork, and archived print PNGs unchanged.

## Critical regression tests

**Test source:** `label-studio-deploy/qa/boot-harness-v13_6.js`, a synchronous mock DOM with the *actual* 109-cut extension module in browser script order (prior startup smoke tests mistakenly skipped it). The 101 background assets are represented by matching-ID synthetic fixtures; the live endpoint's background source was separately confirmed by Railway's verified asset checks and HTTP responses.

Reproduced on old source:
- The v13.5 full 123-cut startup test crashed at `asset.subtitle.toUpperCase()` and failed to create the editor.

Passed on corrected source:
- Editor initialized with the complete **123-cut** catalog, **14 original cut templates**, and **17 master label** choices.
- Exactly **101** selectable background entries were built in the mock catalog.
- Template-selection click changed `master-cooked_meal` → `master-raw_plain`.
- Background-selection click changed the current background → `BG-013`.
- An extended cut candidate could be converted into a sample cut label with BG-101 and a cautionary unverified cooking note.
- Startup produced no synchronous exception in the full-extension harness.
- Focused-mode CSS no longer hides the Background Library.

## Limits and next checks

The connected browser reader can read the user's open tab but **cannot click it**. The interaction test above is a code/DOM simulation. It is not a literal live-session click, screenshot review, printed label, or actual B1 Pro hardware certification.

Open the v13.6 URL in a new tab and verify that the ready banner, 17 master templates and background thumbnail gallery display. Use one template and one BG choice. If an error is shown, keep its **first** error text and inspect it before further deployment. Do not report success based solely on Railway status.

The 109 cut images are candidate art, not reviewed food packaging claims. Do not silently approve them or supply unsupported cooking temperatures.
