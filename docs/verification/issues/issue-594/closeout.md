# Issue 594 Closeout

## Summary
- Hardened visible product copy policy from a flat fragment list to scoped policy groups.
- Product routes now fail closed on generic legacy terms such as `demo`, `demo workflow`, `demo seed`, and `trial`.
- Advanced/Evidence exceptions and source identifiers require explicit classification, justification, and expiry.

## Proof
- Policy hardening: `policy-hardening-output.json`.
- Rendered product routes: `rendered-product-route-output.json`.
- Advanced/Evidence exception: `advanced-evidence-exception-output.json`.
- Generic demo negative: `generic-demo-negative-output.json`.
- Product docs copy: `product-docs-copy-output.json`.
- Source identifier allowlist: `source-identifier-allowlist-output.json`.

## Files Changed
- `docs/verification/visible-product-copy-policy.json`
- `docs/verification/visible-product-copy-allowlist.json`
- `scripts/check-visible-product-copy-all-routes.mjs`
- `scripts/lib/simulation-v0-repair-utils.mjs`
- `docs/project/access-gate-identifier-migration-plan.md`
- `docs/project/geometry-repair-status.md`
- `docs/project/human-review-governance-hardening-status.md`
- `docs/project/operational-demo-ux-status.md`
- `docs/project/plan-1-demo-readiness-status.md`
- `docs/verification/simulation-v0-false-positive-repair-manifest.json`
- `docs/verification/issues/issue-594/`

## Commands Run
- `npm --workspace packages/shared test`
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `node scripts/check-visible-product-copy-all-routes.mjs --stage policy-hardening --allow-partial --issue 594`
- `node scripts/check-visible-product-copy-all-routes.mjs --stage rendered-copy --allow-partial --issue 594`
- `node scripts/check-visible-product-copy-all-routes.mjs --stage generic-demo-negative --allow-partial --issue 594`
- `node scripts/check-visible-product-copy-all-routes.mjs --stage product-docs-copy --allow-partial --issue 594`
- `node scripts/check-no-phi-fields.mjs`

## Tests Passed/Failed
- Passed: shared tests, 964 tests.
- Passed: web tests, 211 files.
- Passed: web build.
- Passed: visible-copy policy-hardening, rendered-copy, generic-demo-negative, product-docs-copy, Advanced/Evidence exception, and source allowlist stages.
- Passed: no-PHI scan.

## Evidence Artifacts
- `docs/verification/issues/issue-594/`
- `docs/verification/visible-product-copy-policy.json`
- `docs/verification/visible-product-copy-allowlist.json`
- `docs/verification/simulation-v0-false-positive-repair-manifest.json`

## Known Limitations
- Historical/internal source identifiers remain temporarily allowlisted and must be removed under their expiry conditions.
- Simulation v0 remains internal synthetic dry-run only.
- Manual visual review remains required.
- Promotion remains blocked.
- Full-event simulation, optimizer behavior, assignment recommendations, clinical safety scoring, staffing compliance certification, and patient outcome prediction remain out of scope.

## Non-PHI Confirmation
- Non-PHI rules still pass. This issue added no PHI, real identity, EHR integration, medication names, diagnosis text, clinical notes, optimizer behavior, assignment recommendation behavior, or clinical/staffing/outcome certification claims.

## GO / NO-GO
- GO for next issue.
