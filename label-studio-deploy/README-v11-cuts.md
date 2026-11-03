# Nerdeus Meals Label Studio — Cut Library v11

## Implemented
- Source: `Nerdeus_Meals_123_Cuts_and_Sausages_2bit_300dpi.zip` (archived 2026-11-01), manifest verified against SHA-256 hashes
- Total catalog: 123 unique illustration IDs; 14 existing Live Studio entries retained, 109 new candidates added
- All new assets: transparent exterior, opaque pure black or white interior, 540 × 215 px PNG at 300 DPI
- Loaded from `/assets/cuts-123-extended.js` after the base cut catalog and before package templates
- Cuts now appear in the existing illustration selector and in master-label food artwork options
- New built-in assets referenced by ID instead of embedding duplicate image bytes into every template's localStorage
- Existing 100 approved red/white backgrounds and historical snapshot bytes unchanged

## Important
- All 109 new illustrations are **artwork candidates**, not food-specification approvals
- Some archive art includes decorative herbs. Do not approve for raw packages unless those are actually packed contents.
- The archive does not cover every species (e.g. moose, bison, elk) or prepared foods such as diced onion/pepper mixes and lasagna; there is no automatic substitution with a pan or bowl image
- Package data / artwork must pass existing review and print validation before sending to B1 Pro
- No verified physical NIIMBOT B1 Pro print or barcode scan test has been completed by this update

## Manual acceptance
1. Refresh editor; Artwork Library count must be 123
2. Filter to Venison, Lamb, Duck, Salmon, Shrimp, Sausage; ensure expected cut imagery is present
3. Select `master-raw_plain`, open Label Data, select new `beef_tomahawk` illustration; it must render as a draft and remain candidate
4. Confirm old `beef_ribeye` label still displays its prior artwork
5. Confirm a saved template and archived print snapshot still open
6. Check exact red, black, white PNG and test QR scanner and physical stock when practical
