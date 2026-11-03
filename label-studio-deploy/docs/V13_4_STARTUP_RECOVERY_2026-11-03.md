# Nerdeus Label Studio v13.4 — production startup recovery

Date: 2026-11-03

## User-visible failure
The live page responded HTTP 200, but the template chooser was empty, the label title remained its static "Prepared meal label" placeholder, layers remained 0, and the inspector stayed blank. Previous Railway deployment success did not mean the browser editor initialized.

## Root cause (reproduced)
In `label-studio-deploy/index-v13_3.html`, the startup function contained:

```js
$('.tab').forEach(btn=>btn.onclick=()=>{state.tab=btn.dataset.tab;renderInspector();paintMobilePreview();});
```

The helper `$` calls `document.querySelector` (one DOM element), while `$$` calls `document.querySelectorAll` (an array). Thus calling `.forEach()` on the one-element result throws a synchronous TypeError and halts `setup()` before `refresh()`. It also prevented the end-of-setup `window.__labelStudioTest` hook from being established.

The source-patching utility previously used `String.replace(search,replacementString)` with a replacement containing `$$`. JavaScript replacement strings interpret `$$` as a single literal `$`. To prevent this regression when authoring future code replacements, pass a replacement **callback**, e.g. `source.replace(from, () => to)`, so the two-dollar selector is preserved.

## Fix
- Restored `$$('.tab').forEach(...)` in the UI bootstrap code.
- Added a visible `#nlsBootStatus` message. Successful initialization confirms the editor is ready; browser script errors and unhandled promise rejections produce a visible failure reason rather than a silent empty page.
- Kept all v13.3 layouts, v13.2 validators, approved 101 backgrounds, 17 types, cut illustrations, JSON templates, browser storage and immutable PNG archives unchanged.
- Rebuilt source as `label-studio-deploy/index-v13_4.html`, pinned by GitHub content blob `71c4abb3af7155fb1abe5090d319f394198aead4` on immutable commit `8061f8b9a0f7c6723b78a84200eb000728466f12`.
- Railway live deployment `b042ff10-b7b0-42b5-bcd0-2624d20a38de`: SUCCESS, no warnings, service online.

## Startup test
Added `label-studio-deploy/qa/boot-harness-v13_3.js`, a synchronous full-script boot smoke harness that executes inline/external modules in the same order with a DOM stub and fake imagery (does not replace real browser testing).

1. With broken source, reproduced `TypeError: $(...).forEach is not a function`; no UI hook and no rendered template list.
2. With corrected v13.4 source, all script modules (including print queue and page navigation) initialized without synchronous errors in the harness.
3. The bootstrap selected `master-cooked_meal`, populated **60 test-environment templates** (without the full 123-cut expansion), created a 33-layer cooked-meal document, populated ~4,400 characters of template-selector markup and ~14,400 characters of inspector markup.
4. Library assets and template contents were not replaced or cleared by the correction.

## User acceptance
Open a **new** link to bypass an already-open browser tab, or hard-refresh with Ctrl+Shift+R:

https://nerdeus-label-studio-production.up.railway.app/?template=master-cooked_meal&view=data&release=v13.4

Expected: green/tinted ready status; cooked-meal master selected; template choices; lasagna preview with red/black Heritage headers, 33 editing layers; package-data fields populated. A visible error banner indicates any future startup failure.

This smoke test uses mocked DOM/canvas objects. Actual user-browser render, printer connection, physical output, red/black registration and printed QR scans remain unverified. Do not infer those are passed.
