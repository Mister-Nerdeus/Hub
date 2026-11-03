# Nerdeus Label Studio v14.1 — Workflow Acceptance and Printed Layout Refinements
Date: 2026-11-03
Project: Nerdeus Meals / Label Studio
Production: https://nerdeus-label-studio-production.up.railway.app/?view=create&release=v14.1

## Release status
- Railway project d23d52cd-ba62-4f04-a6c5-00476d73a648, service 0a49ac30-6184-4a48-bf89-e4eec3bc5de8, production environment 8dfd8487-0055-43f3-b59f-13bdc425ae6d.
- New deployment ID 8ff7f93a-cc8c-45ae-bf3d-c8a286485cf4: SUCCESS; service online and no reported active issues or recent failures.
- Git-blob verified complete source for:
  - label-studio-deploy/index-v14_1.html (blob b3930fe9814406080b4badb0091b475951be6bbe)
  - label-studio-deploy/assets/master-label-v14_1.js (blob 34fc361ea6ab5efce08cb5da5c51214f676238f7)
  - label-studio-deploy/assets/queue-v14_1.js (blob b76482b7568a1a185abee370b5ece8a435c83eaf)
  - label-studio-deploy/assets/workflow-v14_1.js (blob cc702963b73fcc9ea956bb2751c6e6bb005ecd8b)
- Previous v14 and v13.9 assets remain versioned in the repo. User data, stored designs, browser archives, and background IDs were not intentionally cleared.

## Frontend UX and physical label refinements deployed
1. Dry baking/mix packages now derive the actual printed footer from structured `waterAddition`, `oilAddition` and `actionText`; example with confirmed amounts:
   `ADD 300 ML WATER + 15 ML OIL` followed by a second line such as `MIX AND KNEAD DOUGH`. Amounts are not guessed; both are required for dry mixes.
2. Sauce/stock concentrate packages now print the recorded `dilution` and handling text in the same two-line footer, instead of leaving dilution as record-only.
3. Raw protein top header can use the recorded species rather than guessing species only from free-form product name; the second header displays bone/skin condition when available. The actual cut and attributes are included in the narrow middle descriptor when not already in the food name.
4. Prepped ingredients and leftovers can expose recorded preparation method and source meal in the middle descriptor. This is informational; the full package record retains longer details.
5. Footer and middle descriptor have print-legibility checks (maximum two footer lines, 47 characters per line; 54-character descriptor). Overlong text blocks print approval instead of silently truncating important information.
6. Decorative red background and black/white food-art preview thumbnails now appear in guided artwork selection. Unsupported dessert/fruit-only choices remain excluded from NEW guided selections while prior saved artwork remains recoverable in the advanced editor.
7. Added a separate browser-local **Printer attempt history** display below design snapshots. It records a driver attempt as `requested`, `driver_completed` or `driver_result_unknown`; it never presents driver completion as physical or QR verification. Guided flow hides the attempt history until the user leaves the wizard.
8. When driver printing succeeds but saving completion status fails, the application reports a **completed driver request with an audit-log failure**, not a false printing failure. It advises inspecting physical output before retrying. If the driver errors, physical result is marked unknown.
9. Previous label templates with revision v14 are preserved as prior layouts when canonical v14.1 masters are introduced. Existing package instances are not automatically reprinted or silently overwritten.
10. Batch export metadata now identifies v14.1 instead of the earlier v9/v13.9 values.

## Verification completed in this conversation
### Source and isolated logic
- All inline HTML scripts and the three versioned v14.1 modules passed JavaScript syntax compilation.
- 17/17 canonical label types passed synthetic valid-data `makeBlank` and `validate` tests in an isolated JavaScript runtime.
- Dry-mix footer test confirmed actual water and oil quantities in printed field binding `{{pkg.printInstruction}}`.
- Concentrate footer test confirmed recorded dilution plus handling directions.
- Raw protein test confirmed recorded `RAW CHICKEN` header, `BONELESS SKINLESS` second header, and `BREAST` descriptor.
- Negative tests confirmed missing water addition, nonnumeric water input, and placeholder raw cooking guidance remain blocking.
- Simulated guided UI route passed 7/7 smoke checks: home, type, details, field updates, artwork, review, and stored printing instruction derivation.
- Isolated print lifecycle tests passed three driver scenarios: normal completion, uncertain Bluetooth/driver error, and a successful driver request whose audit-log write subsequently failed.

### Actual browser testing (not yet completed)
A GitHub Actions Chromium acceptance test has been checked into:
- `label-studio-deploy/tests/v14_1_browser_acceptance.cjs`
- `.github/workflows/label-studio-v14_1-browser.yml`

The test is designed to launch a **disposable browser profile** and check the actual production guided flow, all 17 type choices, dry-mix fields and dates, printed footer, raster palette and 576×827 crop, manual review, reload persistence, type switching, imported design approval reset, and mobile viewport. It does NOT call Bluetooth or send a print request.

GitHub Actions run https://github.com/Mister-Nerdeus/Hub/actions/runs/41699029847 returned **failure without executing any job steps**. The same check found other repository CI jobs on the same commit marked failed with no steps or log URLs. This indicates the browser run could not be used as evidence of an app failure or a successful test; the root cause of the CI execution failure was not established by the available tools. The test source and workflow remain ready for a future runnable Actions environment. Do not mark real browser click/reload/mobile acceptance as passed.

The chat's connected browser tool is read-only. Its open tab continued to show v13.9, not a refreshed v14.1 session; therefore actual v14.1 clicks could not be manually performed in this conversation. Reopen the v14.1 link in a controllable browser/Work session for visual acceptance.

### Hardware testing (not yet completed)
Physical B1 Pro printing, red/black registration, barcode and package-ID QR scanning, dual-color label stock, adhesive freezer endurance, and printed date readability have not been verified. Do not mark a driver response as physical success.

## Acceptance test instructions
1. Open the guided production URL in a new tab and verify v14.1 boot status.
2. Use Create new label -> select dry baking mix, supply real data, water and oil, and valid dated events; verify the two-line footer and 591x827 preview.
3. Enter verified allergens, storage and mass/imperial quantity pair; inspect conditional fields and legibility alerts.
4. Review the actual package records; verify app does not automatically approve food safety information.
5. Switch to raw protein; confirm actual species, cut and bone/skin info are printed appropriately without mixing up previous package IDs.
6. Confirm the chosen red background and selected black/white food image each have a distinct visible preview and require separate review.
7. Save/reload and verify the package persists. Test backup export/restore and imported review reset in an isolated browser profile, never overwrite personal original data.
8. Open advanced designer, run editor checks and the 17-label raster QA, inspect failures.
9. Review Printer Attempt History, then test with a B1 Pro only after using verified 50x70 mm dual-color stock; scan QR and inspect output after freezing and condensation.

## Backend requirements for later coding
- Canonical typed `LabelTypeDefinition` and versioned fields.
- `PackageRecord` with globally unique ID, quantity, event dates, source recipe/batch, and separately reviewed allergens and safety instructions.
- `PrintComposition` model: physical field priorities, two-line header, 2-line footer, red/black/white exact palette, optional cut/ingredient descriptor, and overflow reports.
- `PrintSnapshot` immutable 591x827 PNG, 576x827 centered raster, SHA, template revision and review provenance.
- `PrintAttempt` distinct driver status, error/unknown outcome, physical inspection and QR verification.
- `WorkspaceBackup` with per-record recovery, automatic safety copies and merging; global storage server-side later.
- `ArtworkAsset` palette/size/approval verification, food-art provenance and retired-background status.
The current application remains browser-local UX with mocked sources for unsupported backend fields.

## Further improvement opportunities
- Add searchable food theme families for the 101 red engravings and replace deprecated designs only after approval, preserving prior ID references.
- Add visible page-level preflight status and specific errors next to each typed required field.
- Update archived v14 *package instances* via explicit opt-in layout upgrade; do not auto-rewrite old user-generated print snapshots.
- Run the GitHub Actions browser test in an environment where the runner actually starts.
- Collect exact physical B1 Pro calibration evidence before certifying user-facing print output.
