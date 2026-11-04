# Nerdeus Label Studio — Approved Heritage Packaging Goal
Status: Active design goal | Established 2026-11-04 | Reference: user-approved 12-label packaging sheet (four groups of three)

## North-star goal
Make **every one of the 17 Nerdeus food-storage label types** default to a consistent, premium heritage-style package label that visually matches the approved reference sheet, remains readable at actual 300-DPI printed size, and uses ONLY exact #FF0000 red, #000000 black, and #FFFFFF white pixels.

## Non-negotiables
- Food name first: two-line bold white uppercase product name on a solid red full-width, square-corner header.
- White circular food/category icon in the red header. The icon must accurately represent the package; unknown protein details must not be guessed.
- Full-width BLACK preparation/storage bar immediately below the header, with centered bold WHITE state.
- Detailed BLACK food engraving dominant in an otherwise white middle field; RED botanical line engraving confined to sides and upper corners. Do not obscure or paint red over food.
- Small bold ingredients/preparation descriptor, balanced metric/imperial quantities, and compact packaging information.
- Red filled allergen capsules only when allergens are positively recorded. Blank never means allergen-free.
- Black QR code contains **package ID only**, accompanied by compact dated-event rows and clear date labels; no invented use-by dates.
- Full-width rectangular black footer with verified cook/reheat/use instruction, or type-appropriate quality-date guidance if recorded.
- No 'Nerdeus Meals' branding inside the printable label. The designer's website branding is separate.
- 50 × 70 mm native artwork remains 591 × 827 px; existing 576 × 827 printer raster is not modified without proof. Native 50 × 80 mm requires its own 591 × 945 profile and physical validation.
- Never rewrite existing saved packages, customized templates, archives, or immutable print snapshots automatically. Use versioned defaults and explicit apply actions.
- Mockup sample dates, safety information, food-cut artwork and QR code values must not become real package facts.

## Acceptance gates
1. All 17 newly generated master previews use the same red-black-white zone geometry, BG-102 side florals, square red header, square black status/footer, and legible balanced measures.
2. All 17 label types render with zero noncanonical colors, no overflowing text, no hidden QR and no overlapping critical fields. Test short/long names, empty/long allergens, multi-date cases and no illustration.
3. Guided Create from every type yields an independent blank package; editing one never edits another.
4. Software preflight blocks missing facts and raster/QR failures, but never claims to certify physical print.
5. At least one real red/black B1 Pro proof print is verified for head width, alignment, readable typography and QR scan.
6. Historical saved packages and archives are byte-for-byte preserved unless the owner explicitly chooses to apply a new layout.

## Implementation track
- V16: BG-102 floral framing and default new-master selection. Implemented, physical acceptance outstanding.
- V16.1: Square-corner reference composition; improved red header, states, illustration placement, measured date rows and footer. Implement before adding new backgrounds.
- V16.2: Visual regression matrix 17 types × edge cases, browser workflow integration and physical-label proof sheets.
- V17: Dedicated native 50 × 80 mm layout and separately validated B1 Pro output profile.

## Scope
Nerdeus Meals front-end label design and packaging workflow. Backend requirements remain documented rather than invented.
## 2026-11-04 implementation and audit update (v16.1)
- Default master example and blank-package creation now use a distinct `pkg.templateRevision: v16.1`, while older saved real packages retain their original revision.
- v16.1 applies a square-corner reference composition only to documents with that revision: larger red title, black state/footer, botanical BG-102, wider black food illustration, equal-unit weights, compact allergens, dates and QR.
- An explicit UI action upgrades reusable saved master previews; real saved packages and immutable print snapshots are outside the action's scope.
- Existing v15 masters in browser storage are separately archived during the default-template migration; the active master is replaced with v16.1, not overwritten without a preserved prior copy.
- Railway deployed successfully; source modules (including reference style) loaded without reported errors after one source-anchor mismatch was corrected.
- The connected browser tab was not freshly reloaded in the verification tools. No end-to-end browser workflow, rendered proof-sheet comparison, or physical NIIMBOT B1 Pro print has passed acceptance yet.

### Next audit gates
1. Reload the production designer; visually compare all 17 template previews to the 12-example reference sheet. Record per-type differences and review long-name/empty-allergen/4-date extremes.
2. Run editor QA and actual first-run guided Create/Save/Snapshot and restore checks; fix failures before approval.
3. Run hardware proof for red/black separation, QR scan, 576px head cropping and actual readable text sizes.
4. Build genuinely native 591×945/50×80 layout only after printer profile validation; current larger export is explicitly a draft proof.

## 2026-11-04 continuation — v16.4 proof lab
A separate, immutable-source-verified visual proof module was added:
- `label-studio-deploy/assets/proof-lab-v16_4.js`
- Railway serves it at `/assets/proof-lab-v16_4.js` and injects it after the existing application scripts.
- Access the integrated panel with `?view=proof&release=v16.4` or from the Label Studio page.
- Generate 17 actual-renderer examples using temporary synthetic package IDs and example processing dates. Samples are marked not for food packaging.
- Preview labels as native 591 × 827 canvases; download a 3-column full-resolution screen proof contact sheet without resampling individual label pixels.
- Run 102 checks (17 types × 6 cases): default geometry/palette, oversized title, allergen overflow, four date rows, no art, oversized footer. Export JSON results.
- No localStorage, snapshot, food-package or printer writes are performed by the proof lab.
- Pinned source hash verification, assembled HTML inline JS syntax checks and the proof module's own JavaScript syntax check passed.
- Railway reported SUCCESS for v16.4 with the proof lab source verified (13,262 bytes).
- Actual browser interaction, QA pass/fail counts, subjective visual similarity to the approved sheet and physical red/black printing are **not** yet verified.
- The 50 × 80 mm output remains a separate draft proof, not a validated physical print profile.

Next acceptance action: load the production proof panel, click Generate 17 labels and Run 102 checks, inspect the PNG at actual pixel size, repair reported layout issues, then physically validate a real print before acceptance.
