# Nerdeus Label Studio v14.4 — Field Validation, Local Save Performance and QA Handoff
Date: 2026-11-03
Guided site: https://nerdeus-label-studio-production.up.railway.app/?view=create&release=v14.4
Advanced editor: https://nerdeus-label-studio-production.up.railway.app/?template=master-cooked_meal&view=data&release=v14.4

## Production release
- Railway project: d23d52cd-ba62-4f04-a6c5-00476d73a648
- Service: 0a49ac30-6184-4a48-bf89-e4eec3bc5de8
- Production environment: 8dfd8487-0055-43f3-b59f-13bdc425ae6d
- Verified current deployment: 9b5505a1-f588-4e15-8068-38cee8f13cf7
- Deployment status SUCCESS / online, zero reported active warnings, critical issues or recent deployment failures at verification.
- No site, label, archived PNG, library/background ID, browser-local package or user data was intentionally deleted or cleared.

## Pinning and source
| Resource | Git blob | Creation/latest commit |
|---|---|---|
| label-studio-deploy/index-v14_4.html | 6fd69c9a0b0b6b3119e3860d70ab708ad0ccccde | 80af2a52c326df534ab8a756424a1e6b417295b3 |
| label-studio-deploy/assets/master-label-v14_4.js | 4e688a9eb6ab15063ae792b06d7c0ea13375ca97 | 058e8d177fa553784932a7808216e90830411817 |
| label-studio-deploy/assets/workflow-v14_4.js | bd8dfa4c32f4eaa2cb82c65b6c44196d1298a148 | f45d0b335e74e62d896b248be9d65b68183a6e14 |
| label-studio-deploy/assets/field-validation-v14_4.js | 71ee654e958182b6434e0480a1dbb1358c19cdc8 | a7365f2fe9cfe8a7417b4347f8dbea9628c25b01 |
| label-studio-deploy/assets/queue-v14_3.js (unchanged) | 1e83b188f27b7a786184bdb8706cf33528ac15bc | c92b05c9bd4a82f1e85d023fcdb63f137e6d85db |

The Railway Bun Function verifies immutable Git blob SHAs before serving assets. New field validation has its own verified /assets/field-validation-v14_4.js route and is required by /healthz and sourceVerified. Previous v14.3 and historic sources remain available in the repository.

## Findings and fixes
### P1 — No field-specific feedback before Review
The v14.3 guided editor tracked six basic recorded facts, but the user could enter invalid measurements, improperly formatted package IDs, missing dated events or unsupported values and only get broad warnings at final Review.

**v14.4 implemented:**
- Separate browser module attaches field-level messages without changing package data structure, prior labels or final print preflight.
- Show inline errors below fields on blur/change, and refresh a previously touched field as the user corrects it; do not show dozens of warnings before the user begins entry.
- Add accessible aria-invalid, aria-describedby and role=alert messages. Errors are attached to the corresponding field.
- Individual checks: package ID format and browser-local duplicates; positive metric/imperial unit consistency; storage selection; non-allergen-free claims; placeholder raw-protein handling directions; actual source required fields by label type; positive/unit-qualified bread mix additions; output footer-length constraints; printed descriptor fit warning; validity and duplicates of processing dates; use-by/quality date chronology; missing required processing events grouped near date entry.
- Errors are UI guidance only. The existing shared, fail-closed LabelPrintLifecycleV14 preflight still decides if an actual package is printable, and none of these checks invents dates, allergens or temperatures.
- A 'Continue to artwork' action remains available; incomplete fields are still blocked before final print or batch output.

### P1 — Rewriting entire browser workspace while typing
The master form previously called saveLocal() and JSON.stringify(all templates/assets) on every keystroke, potentially blocking the main thread as the library and saved package count grew.

**v14.4 implemented:**
- Advanced master form input events schedule a browser-local save 450 ms after the most recent edit; focus blur explicitly flushes.
- Page-hide and visibility-hidden events flush pending saves, reducing loss from navigation/closing.
- No-op writes are avoided when the serialized workspace is unchanged.
- Existing immediate saves for new packages, confirm/review actions, queue validation and other important state changes remain immediate.
- Save status distinguishes pending, locally saved, quota/storage failure, and recovery-blocked states.
- Advanced diagnostic counters are exposed via window.__labelStudioTest.getStorageMetrics() (write count, skipped duplicates, deferred saves, failed saves, pending state, external-tab conflict); they contain no package content.

### P1 — Concurrent tabs could silently overwrite saved work
A second Label Studio tab could save an old in-memory workspace over changes made in the first tab.

**v14.4 implemented:**
- Browser 'storage' events for the workspace key detect external changes that differ from the last locally written snapshot.
- The stale tab is blocked from saving over the newer data, any pending save timer is canceled, and the user sees a specific warning.
- The user can export a Workspace backup of the current in-memory state and reload; the application does not silently merge divergent package records.
- Actual concurrent-tab browser clicks still need browser acceptance testing.

## Test evidence completed
### Static and isolated runtime tests
- All 12 inline scripts in the HTML and all new JS modules passed compilation.
- 17/17 canonical label types passed synthetic valid-data makeBlank/validate logic checks with unchanged type IDs and packaging invariants.
- 16/16 field-validation logic cases passed: required foods, valid and duplicate IDs, unit mismatch, bad allergen claims, unmeasured/zero measured additions, placeholder raw cooking text, valid/invalid/duplicate/chronologically incorrect events and required type-specific event.
- DOM-mock validator test confirmed: field feedback mounts in details, a bad ID is flagged after blur, correcting its value clears the message, and an invalid water addition produces an inline message.
- Browser-storage simulation: 12 scheduled edits caused 0 immediate writes, followed by one actual flush/write. A subsequent unchanged immediate save was skipped. A new series of edits produced one more write. Quota failure returned false, showed SAVE FAILED, and retained the previously saved JSON.
- Railway startup logs verified Git blob SHA for page v14.4 and field validator; production deployment status SUCCESS/online.

### Browser acceptance attempt — not passed
- Added label-studio-deploy/tests/v14_4_browser_acceptance.cjs and .github/workflows/label-studio-v14_4-browser.yml.
- Disposable Chromium script covers selecting labels, type-specific additions, inline errors, output palette and raster dimensions, manual review, reload persistence, import-review reset, deferred-save metrics, external-tab conflict and phone-width entry.
- GitHub Actions run https://github.com/Mister-Nerdeus/Hub/actions/runs/41728785270 concluded FAILURE with job steps unavailable/null, matching earlier unrelated repo CI failures. No browser assertions ran or passed in that job. This cannot be treated as evidence of a site regression or an acceptance pass.
- In the current chat, Browser tooling reads an open tab but cannot click/reload. The connected tab remained on v14.2 when checked, not refreshed to v14.4.
- Actual Chromium screen interactions, persistent storage across real reload, keyboard/touch and two-tab concurrency still require a controllable browser/working CI runner.

### Physical printer acceptance — not performed
The physical NIIMBOT B1 Pro, red/black 50 × 70 mm stock, printhead alignment, red registration, package-ID-only QR scan, condensation/freezer adhesive and long-term readability are **not independently verified**. A driver-completed status is not physical acceptance.

## Reproducible manual checks
1. Open v14.4 guided URL fresh and confirm v14.4 boot status.
2. Pick Dry baking/meal mix. In Water to add enter 'a splash', blur; see an inline error. Change to '300 mL'; error should clear.
3. Enter metric 500 g and imperial 0.1 oz; unit mismatch warning should appear. Correct imperial to 17.6 oz; verify the warning clears.
4. Enter a duplicate or lowercase package ID; see warning; change to a unique 6–20-character uppercase ID; verify the warning clears.
5. Choose date event but leave date blank; confirm an event-specific error. Enter date earlier than packing date for use-by; confirm chronological warning.
6. In advanced data editor type multiple characters into package data; save status should say Pending before later showing Saved, not write all assets for each keystroke. Tab away and reload; confirm values persist.
7. In disposable browser tabs open same workspace in two tabs, make edits in one, then try to save from the other. Stale tab must warn and refuse overwrite; export a backup of any unsaved work before reloading.
8. Confirm review/print remain fail-closed with missing ingredients, dates, quantities, or verified handling guidance.
9. Test B1 Pro with actual stock, verify print offset, both color planes and package-ID-only QR, then repeat after freezer/condensation handling. Record calibrated printer/stock results separately.

## Deferred implementation contracts
- Recipe, pantry, packaging and storage data adapter with source/reviewer provenance.
- Structured LabelTypeDefinition and PackageRecord type rules with relevant event chronology and no fabricated shelf life.
- One immutable PrintSnapshot and separate PrintAttempt/PhysicalVerification, including driver uncertainty and QR verification.
- Global package-ID uniqueness and cross-device sync (browser-only duplicate protection is insufficient for production).
- Transactional, per-document persistence, incremental update logging, and cloud backup/restore. Current v14.4 is a performance-safe debounce, not a backend database or infinite local browser storage.
- Future advanced master editor use of per-document Undo snapshots (existing focus checkpoints still snapshot the whole workspace) and curated food-only backgrounds with preserved legacy IDs.

## Completion status
Production update and isolated logic/storage tests: complete.
Live browser regression and physical printer certification: NOT COMPLETE / not claimed.
