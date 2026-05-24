# Issue 191 Closeout

## Summary

Pinned workspace dependency specs that previously used `latest`, added a local dependency-spec gate, documented runtime dependency policy, and wired the gate into local verification.

## Working Discipline

1. Reproduced the pre-fix failure: manifest scan found floating `latest` specs in web/shared manifests and lockfile workspace metadata.
2. Implemented the smallest bounded fix: exact versions matching the already-resolved lockfile versions plus a dependency-spec check script.
3. Added positive and negative behavior for the gate through its deterministic pass/fail scan logic.
4. Ran required gates and captured outputs.
5. Added command-output evidence under this issue directory.
6. Updated `docs/verification/ISSUE_EVIDENCE_INDEX.json`.
7. Listed non-claims below.
8. No deferred follow-up issues for this issue.

## Files Changed

- `package.json`
- `package-lock.json`
- `apps/web/package.json`
- `packages/shared/package.json`
- `scripts/check-dependency-specs.mjs`
- `scripts/verify-local.mjs`
- `docs/architecture/dependency-policy.md`
- `docs/verification/ISSUE_EVIDENCE_INDEX.json`
- `docs/verification/issues/issue-191/*`

## Commands Run

- `npm ci`
- `npm --workspace packages/shared test`
- `npm --workspace apps/web test`
- `npm --workspace apps/web run build`
- `cd apps/api && python -m pytest`
- `node scripts/check-docs-contracts.mjs`
- `node scripts/verify-local.mjs`

## Tests Passed

- Clean npm install passed.
- Shared TypeScript tests passed.
- Web tests and build passed.
- Python API tests passed.
- Docs contract gate passed.
- Full local verification passed.

## Evidence Artifacts

- `first-failure.txt`
- `dependency-policy-output.json`
- `dependency-scan-output.json`
- `test-output/install.txt`
- `test-output/shared.txt`
- `test-output/web.txt`
- `test-output/api.txt`
- `test-output/docs-gate.txt`
- `test-output/verify-local.txt`

## Known Limitations

- The dependency-spec gate checks workspace package manifests, not transitive dependency ranges inside third-party packages.
- Runtime versions are documented as local policy; this does not certify a deployment environment.

## Next Recommended Issue

Proceed to Issue 192, production vs local Docker split.

## Non-Claims

- No product behavior change.
- No simulation behavior change.
- No new major dependency.
- No production readiness claim.

## Non-PHI Confirmation

No PHI fields or support were added. This issue only changes dependency metadata, local verification gates, and dependency policy documentation.
