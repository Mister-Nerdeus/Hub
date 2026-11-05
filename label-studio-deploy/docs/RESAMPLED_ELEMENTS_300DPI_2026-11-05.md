# Nerdeus Meals — Resampled red/black packaging assets

Date: 2026-11-05  
Release: **Label Studio v16.10**  
Source: `Nerdeus_Red_Black_Element_Breakdown.zip`

## Goal
Enlarge extracted raster illustrations to predictable image dimensions for the B1 Pro label designer **without introducing intermediate ink colors, changing aspect ratios, or falsely implying restored engraving detail**.

## Results
| Asset class | Families | Variants/files | Output per file | DPI |
|---|---:|---:|---|---:|
| Food imagery | 6 | 24 | 540 × 215 px | 300 |
| Icons | 8 | 40 | 128 × 128 px | 300 |
| **Total** | **14** | **64** | — | — |

Each food family retains black-on-white, black-on-transparent, inferred white-interior/black compound, and inferred white-underlay variants. Icons retain black, red, and white print-plane variants. Source food crops ranged from approximately 235–280 pixels wide and 96–122 pixels high; all resampling preserves the original content aspect ratio centered inside the target canvas.

## Method and verification
- Independently extract exact black, red, and white masks, then resample each with Lanczos filtering.
- Threshold each resized mask at 160/255 to form hard 1-bit channels and compose with binary alpha; no gray, blur, or partial alpha is retained.
- Preserve color underlays as separate assets; white interior underlays are **inferred and unapproved**.
- Save PNG metadata at 300 DPI.
- Check every one of the **64** resulting files for exact RGB/alpha palettes, target dimensions, and DPI.
- Provide a contact sheet comparing the source crop, nearest-neighbor enlargement, and Lanczos+threshold enlargement for all six food examples.
- The longer 540 × 215 food art should be placed inside the existing 591 × 827 label document, not stretched to cover the whole package.

The smooth binary approach improves contour appearance compared with simple nearest-neighbor resizing. It **does not create new food detail**, certify a 300-DPI source, or guarantee readability on hardware.

## Safety and selection
No asset is auto-approved. The bread-loaf illustration depicts the finished food and remains unsuitable as the product illustration for a *dry baking mix*. A stock pot identifies stock/soup packaging but does not establish actual recipe ingredients. Printer and label-roll pictograms are editor UI assets, not food-package icons. Artwork, allergens, temperatures, dates, and QR payloads must be sourced independently.

## Files and deployment
- Full archive: `Nerdeus_Resampled_Elements_540x215_128x128_300DPI.zip` (Library: `/Nerdeus Meals Workshop/Reference Assets/`)
- Manifest and review sheets in the archive: `manifest.json`, `proofs/food_candidates_540x215.png`, and `proofs/comparison_6_food_images_3_methods.png`.
- New browser module: `label-studio-deploy/assets/reference-resampled-v16_10.js`, immutable GitHub commit `fd0edf1e652e6f42c9400cc1bad177de99398cb8`, verified Git blob `fe267ac45d1e4b9775087c2dea3df2f7e44c73ee`.
- The module adds a **resampled candidate comparison gallery** that shows the six food artworks and eight icon families in standard sizes, with a toggle between Lanczos+binary and nearest-neighbor. It reads only; no package, snapshot, printer, or browser-storage mutations.
- Live preview: https://nerdeus-label-studio-production.up.railway.app/?view=proof&release=v16.10&elements=1&resampled=1

## Status
**Verified:** 64 binary PNGs at exact target dimensions and 300 DPI, Git source match, 32 HTML scripts with no syntax errors, Railway deployment success and pinned module verification in deployment logs.

**Not verified:** interactive browser comparison, individual candidate acceptance, exact printed black/red registration, QR scanning, or a physical NIIMBOT B1 Pro print. The default BG-103 and v16.7 label layouts remain in place.

## Next approval criteria
1. Review five relevant food drawings and package icons side by side at actual print size; exclude bread-loaf art from dry-mix product labels.
2. Reject weak engravings and create new detailed artwork at native target resolution instead of repeatedly resampling.
3. For approved artwork only, add food/protein/cut metadata, source provenance, allowed label types, transparent/white knockout behavior, approval status, and print proof.
4. Test a physical two-color B1 Pro print before changing defaults.
