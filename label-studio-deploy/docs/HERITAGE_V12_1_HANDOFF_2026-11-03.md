# Nerdeus Meals Label Studio — Heritage v12.1 handoff

**Date:** 2026-11-03  
**Live URL:** https://nerdeus-label-studio-production.up.railway.app/?view=design  
**Railway project:** `d23d52cd-ba62-4f04-a6c5-00476d73a648`  
**Railway function service:** `0a49ac30-6184-4a48-bf89-e4eec3bc5de8`

## What changed

1. Added the BG-101 red-and-white engraved herb background as an *additional* background. BG-001–BG-100 remain intact.
2. Created `label-studio-deploy/assets/heritage-art-v12.js`, with 17 black/transparent 540×215 food-only candidates isolated from the independent v12 design proof PNGs.
3. Created `label-studio-deploy/assets/master-label-v12.js` from the verified v9 master, preserving 17 canonical type IDs. New defaults use Heritage v12. Existing browser-saved templates are unchanged until **Apply Heritage layout to this label** is explicitly selected.
4. Heritage uses two equally styled header lines, a centered food-only hero, a separate product name, matching metric/imperial weights, type-specific events, red allergen bullets only when present, a package-ID-only QR, and black instruction footer.
5. Retained existing hard print gates: DEMO IDs cannot print; dates, packaging, cooking/handling, contents, allergens, and artwork require explicit verification.
6. Live Railway function now loads checksum-pinned `master-label-v12.js` and `heritage-art-v12.js` in place of the old master script, after other base library scripts. This is a **server overlay**, not a destructive change to the earlier pinned HTML source.

## Asset identity

- Heritage master GitHub blob: `257c977686bac4f7cb1e0035c5b469da2646e4f2`.
- Heritage food art GitHub blob: `203e757b66ede1c9b7677d0cd68e498d239f5754`.
- GitHub commit containing both assets: `57a875a15043840ff8b9e2bb142d7b92c9e0f268`.
- Existing v9 master remains at `label-studio-deploy/assets/master-label-v9.js`.
- Existing 100 artworks and 123 cut candidates remain separately preserved.

## Verification performed

- Module syntax parsed successfully.
- In a minimal runtime integration harness, all 17 `LabelMasterV9.make` defaults produced the right `heritage-v12` flag, two-line header, BG-101 selection, food-only image asset, QR bound exclusively to `{{pkg.id}}`, and no out-of-canvas element bounds.
- All 17 remained DRAFT and not eligible for print due to demo IDs and review gates.
- All original v12 proof PNGs were cropped from 591×827 to 576×827 (7 px left, 8 px right) and scanned. **17/17** QR codes decoded from both composite and black-only print planes with the expected package-ID payload.
- Only RGB black, red, white pixels in all proof rasters. RGB layer decomposition into two 1-bit planes checked; zero simultaneous black/red pixels.
- The software raster report, two binary color planes per template, visual previews, and a calibration target are in the Nerdeus Meals Library folder **Printer QA** as `Nerdeus_Heritage_Print_QA_v12_1.zip`.
- Railway deployment after change completed successfully and service was Online. A complete live browser screenshot comparison has **not** been performed; the user must reload the open site to fetch the new assets.

## Printer constraints

- Intended media: NIIMBOT B1 Pro compatible 50×70mm dual-color thermal roll.
- B1 Pro model ID 4097, 300 DPI, nominal 576-dot printhead.
- App uses the installed NiimBlueLib `PageColorType.DoubleColor` and checks model ID before printing; physical output remains unverified.
- **Do not mark physical registration, label feed, thermal durability, or B1 Pro two-channel output as approved until physical calibration print and smartphone QR scan pass.**
- Hardware test: print `B1_Pro_Alignment_576x827.png`, measure edge feed and channel registration, then print one raw, one mixed-prep, and one cooked-meal label. Review smallest typography and verify all sample IDs have been replaced before real food use.

## Compatibility / maintenance

- Data schema remains `nerdeus.label.v2`, version marker `nlsDesignVersion=9` for master compatibility. `pkg.layoutStyle='heritage-v12'` opts into new geometry.
- Saved local templates, imported PNG assets, 123 cut candidates, prior output snapshots, and approval flags are not silently rewritten.
- Future main-app integration should use the same 17 type IDs and `pkg.*` bindings. Do not publish user-facing stock lists or unsupported food labels.
- If moving to repo-built deployment, migrate the Railway URL rewrite into the built HTML: load `heritage-bg-101-v12.js` after `backgrounds-approved-v7.js`, then `heritage-art-v12.js` and `master-label-v12.js` where the former v9 master script was loaded.

## Remaining acceptance

Actual printer-connected verification; compare screenshot renders of all 17 live editable defaults against approved 17 proof sheet; label stock behavior in freezer; optional library of content-accurate illustrations with human review.
