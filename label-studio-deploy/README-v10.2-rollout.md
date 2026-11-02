# Label Studio v10.2 — Master family rollout and visual-approval baseline
**Date:** 2026-11-02  
**Production:** https://nerdeus-label-studio-production.up.railway.app/?view=design
**Scope:** Additive changes to the existing privately administered Railway Label Studio. Do not overwrite existing v9/v10 user-edited templates, archival print snapshots, or approved 100 backgrounds.

## Provisionally accepted design
The three 591 × 827 master-label draft layouts—Ribeye Steak, Onion & Pepper Mix, and Beef Lasagna—are **approved as a temporary visual baseline only**. This does not approve the actual food artwork, dates, ingredients, cooking/reheating instructions, printer alignment, or food safety. Templates continue to use sample IDs and require manual verification before actual printing.

## What's new
- Six family filters and a search input above the existing template list. Default new-workspace view shows only the 17 master presets; existing/custom designs remain accessible through All or Previous/Custom.
- Templates display **product name + exact template type + storage state**, rather than a generic package description.
- On selecting a master template, Label Data opens for efficient editing.
- A non-destructive **New blank package of this type** action creates a separate browser-local record from the current master preset. It never replaces the saved preset.
- Direct links using `?template=master-cooked_meal&view=data` can open a canonical type, while retaining the user's locally saved data.
- The new presets distinguish Purchased, Seasoned, Marinated, Assembled, Packed, Prepared, Cooked, Frozen, Blended, Opened, Use By and Best Quality events where appropriate.
- Real-world quantity notation `US fl oz` is accepted, while incompatible mass-volume combinations are rejected.

## Existing technical safety behavior retained
- Three-color output: only pure #FF0000, #000000, #FFFFFF at 591 × 827 (300 DPI metadata); printer raster 576 × 827 via centered 7/8-pixel crop.
- QR codes encode package IDs only. No invented linked URLs.
- Unapproved food artwork never silently substituted with cookware, a serving dish, another food, or an unrelated cut. Missing art is a clearly marked draft or requires reviewed text-only approval.
- Sample dates and default cooking instructions remain unverified. Actual print is gated by validated values and human review.
- Allergen text appears only when explicitly recorded; absence is not an allergen-free claim.
- Mixed package queue remains available, with stale queue entries blocked after any visual/data edits.

## QA executed
- 17 master records / six families constructed, with unique event types and preserved QR `{{pkg.id}}`.
- All 17 original default package records fail ready-to-print checks, as intended.
- Family filtering: Master=17, Raw proteins=3, Ingredients=3, Cooked food=4; Legacy=1 in synthetic test; search "lasagna"=1.
- Unit check: 250 mL / 8.5 US fl oz accepted; 250 mL / 8.5 oz rejected; 400 g / 14.1 oz accepted.
- A local draft visual contact sheet rendered 17 canvases in pure red/black/white with no uncaught JavaScript errors. **It is a visual QA reference, not a live-browser screenshot or a printer proof.**
- Production Railway source integrity and deployment require separate check after publish.

## Not yet done
- Physical NIIMBOT B1 Pro stock registration, red/black calibration, QR scan and peel test.
- Approval of contents-accurate illustrations for unfilled meal, vegetable and mix artwork slots.
- Actual Nerdeus Meals backend lookup of live inventory, recipe details, cooking times, allergens and package identifiers.
- The validated but separately prepared 123-cut extended PNG library is **not included in this production release**; its transfer/publication must be verified separately before claiming it is live.
