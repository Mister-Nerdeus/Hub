# Nerdeus Label Studio v16.12 — Artwork review

**Date:** November 5, 2026  
**Goal:** Review five food-illustration candidates from the user's resampled 300 DPI element library at the current 482 × 210 px hero layout.

| Candidate | Visual decision | Notes | Physical print approval |
|---|---|---|---|
| Ribeye steak | **Design accepted** | Clear ribeye silhouette and marbling. | Pending |
| Chicken fajita kit | **Rejected for raw kit** | Reads as prepared or plated fajita food rather than an unambiguous raw component kit; retain only for comparison. | Not eligible |
| Lasagna | **Design accepted** | Clearly readable layered cooked meal. | Pending |
| Broccoli florets | **Design accepted** | Strong identity and contrast; dot filling must be checked on thermal paper. | Pending |
| Stock pot | **Category-only** | Suitable generic stock/soup picture, not proof of any specific recipe ingredients or current state. | Pending |

**Measured results**: each image is exactly 540 × 215 px, with binary black and fully transparent pixels. The simulated active hero transform first fits to a 482 × 210 px area, then scales by 1.24 × 1.15 and clips to the illustration region. All five retained their original visible ink without clipping in that modeled transform. This is *not* evidence of actual B1 Pro thermal print quality or color registration.

**Deployment**: v16.12 updates the existing Label Studio UI with individual status labels, reviewed-versus-all-candidates preview modes, and a real-package guard preventing rejected fajita artwork from being attached. Accepted design artwork still has `artStatus=candidate`, `artworkReviewed=0`, and `printApproved=false` when explicitly attached. Previous saved packages and snapshots are not automatically changed.

**Software checks**: the previous v16.11 original proof page reported 102/102 programmed checks passed. The v16.12 reviewed-art proof was syntax-checked and tested for source-level attachment behavior, but its live pixel gallery and 102-check outcome are still unverified. Physical two-color print and QR scan remain pending.

**Next acceptance action**: print a proof sample on the NIIMBOT B1 Pro for the three visually accepted subjects and stock-category image. Check fine marbling/detail, halo/red separation, 576-pixel printable crop, and package-ID QR scan. Only then move any image into the production-approved art registry.

## Production implementation reference
- Review module: \`label-studio-deploy/assets/artwork-reviewed-v16_12.js\`, pinned commit \`185296dc3b57d5f32e43daf94f9aa43d7888eab3\`; Git blob \`06d32cffd49b693300299dad0e7e178ba496fddb\`.
- Proof module: \`label-studio-deploy/assets/proof-lab-v16_12.js\`, pinned commit \`4ed44fe70daae765f3454edcef72c2a6d938e394\`; Git blob \`9130ed6f1fdb3ce5f813fb6ecf4faaa301e1befe\`.
- Immutable review manifest: \`label-studio-deploy/qa/artwork-review-v16_12.json\`.
- Browser entrypoints:
  - \`?view=proof&release=v16.12&art=reviewed\` — three visual passes + one category-only image; rejected fajita art excluded
  - \`?view=proof&release=v16.12&art=resampled\` — all five for side-by-side comparison, including rejected sample art
  - \`?view=proof&release=v16.12&art=original\` — prior artwork
- The editing gallery disables the rejected raw fajita candidate. Its source-level attachment API independently refuses the rejected asset for an editable raw meal kit, even if accessed programmatically.
- Eight direct source-execution tests passed: reviewed-mode inclusion/exclusion, wrong-food refusal, explicit real-package attachment, candidate/print flags and rejected art limited to temporary comparison.
- Live Railway deployment was successful and verified both new pinned modules in runtime logs. The deployed Function readback matched the latest release.
- This is a **visual design review**, not user or hardware authorization to print. The module never auto-populates real packages with these new candidate illustrations. \`pkg.artStatus\` remains \`candidate\`, \`pkg.artworkReviewed\` remains \`0\`, and \`pkg.artworkPrintApproved\` remains \`0\` after explicit insertion.
