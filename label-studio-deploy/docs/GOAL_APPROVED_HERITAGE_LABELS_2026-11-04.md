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