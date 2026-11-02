# Label Studio v9 — Engraved packaging design

Live: https://nerdeus-label-studio-production.up.railway.app/?template=v9-pkg-raw-protein&view=design&v=9
Design example: https://nerdeus-label-studio-production.up.railway.app/?template=v9-pkg-cooked-meal&view=data&v=9
Source: `label-studio-deploy/index.html` and `assets/package-labels-v9.js`, pinned Git commit `bafdaad9e3809e71535407d6dc72e3af3ca89323`.
Runtime has integrity checks on HTML source, v9 JS, v8 JS and the 100 approved red-and-white backgrounds.

## Design direction
Recreates the agreed packaging style in the actual 50 × 70 mm label canvas (591 × 827 pixels at 300 DPI): red header and circular food/category emblem, black status strip, food illustration framed by red botanical ornaments, shape-following binary white dither halo, equal-size metric and imperial quantity, package-type caption, conditional red allergen capsules, QR and dates, black action footer. No brand, generic "Food Label" or "Package Label" text printed.

The food art is deliberately separated from the printing template: the illustration itself must match what is physically packaged. Cooking vessels, serving dishes, imaginary garnishes and missing ingredients cannot be assumed. Only the existing approved cut illustrations are pre-selected by default for a few raw-protein examples. All other templates show a draft "SELECT ACTUAL FOOD ARTWORK" placeholder until the user selects a suitable item or uploads their own; physical printing is blocked while no artwork is chosen.

## Dynamic editor
- 16 selectable v9 types: raw proteins; raw seasoned/marinated; prepped raw vegetables; raw combinations and kits; cooked components and sides; cooked meals; leftovers; soup/stew; sauces; bread mixes; pantry; seasonings; opened/ready-to-eat.
- Label Data tab has category dropdown, content description, metric+imperial quantity, package type, storage, date captions and actual ISO dates, allergen field, action footer and full instructions, QR-only package ID, recipe reference, batch, storage location, and header-icon selector.
- Choose an existing food cut illustration or import a transparent PNG/WebP/JPEG; imports are normalized to black/white binary pixels and transparent outer regions, 540 × 215.
- Toggle white stippled art halo; halo is generated around the food art mask, rendered with exact opaque white pixels rather than blur or gradients; CSV/PNG snapshot and print pipeline remain unchanged.
- Versioned v9 templates have new IDs and are added alongside legacy saved templates; legacy labels and archived exact PNG print snapshots remain intact.
- Links with `?template=v9-pkg-...&view=design` open a selected v9 label without changing saved template contents.
- The 100 approved red/white backgrounds remain available through the existing background library.

## Print-preflight
- Builtin content is SAMPLE and demo package IDs; no automatic date/shelf-life generation.
- Must complete actual packed date, end date, verified food/quantity/storage, allergen review and artwork review; actual meal-image choice is mandatory for v9 illustrated labels.
- Metric and imperial amounts are cross-checked within rounding tolerance; raw cook and reheating temperatures require both °F and °C. Category changes do not silently turn a raw food into a ready-to-eat food.
- QR contains ONLY `{{pkg.id}}`, never a URL.
- Physical B1 Pro output remains experimental until verified on real 50 × 70 mm red/black stock. Batch and dates must come from actual Nerdeus Meals inventory, not demonstration defaults.
- This is a browser-local editor: there is no live inventory lookup, automatic QR backend resolution, true food-image classifier, or verified shelf-life engine.

## Validation
- Syntax checked all HTML inline scripts and v9 JavaScript.
- Constructed all 16 templates from source in an isolated test harness: 16 unique IDs, one package-ID-only QR each, fewer than 100 layers per label.
- Confirmed print-preflight catches demo IDs, missing date and missing meal artwork; no approved food artwork is fabricated.
- Railway deployment `a4baa7b9-7e71-4b55-80b6-3ecd49eddd04`: SUCCESS; runtime verified source SHA and v9+v8+100 background asset digests.
- Actual rendered browser comparisons, multi-image print layout and physical B1 Pro readability remain outstanding.

## Manual acceptance checks
1. Open the direct v9 link; verify large red title, black state stripe, artwork zone, red ornaments, equal metric/imperial weight, dates/QR, black action.
2. Select another v9 label from the sidebar or Label Data dropdown. Name, status, content, packaging, allergens and action should change.
3. Change product name, status and metric/imperial values; preview updates immediately, sample review checks reset.
4. Choose one of the built-in cut images. Preview shows food without a skillet/plate, surrounded by a white binary stipple halo.
5. Upload a true transparent black-and-white PNG; art remains 540 × 215. Confirm no red appears inside opaque food interiors.
6. Turn halo off/on and compare with a dense red background.
7. Set no allergens; no red allergen pills should appear.
8. Change dates and storage; use-by/best-quality captions behave, date values format for display.
9. QR scans to package ID only; selecting a draft/missing-image label blocks physical print.
10. Restore an archived v6/v8 label; its image and print snapshot remain unchanged.
