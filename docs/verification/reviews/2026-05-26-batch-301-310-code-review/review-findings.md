# Batch 301-310 Code Review Findings

## Finding 1: Early corrected-plan review stages depended on final-stage artifacts

Severity: high

`scripts/check-corrected-plan-review.mjs` validated all review artifacts for every stage, including `--stage preflight` and `--stage protocol`. That made Issue 301's staged gates depend on rendered evidence and per-plan review artifacts that are not produced until later issues.

Fix: stage-specific validation now requires only source-correction artifacts for preflight/protocol, a single plan for per-plan stages, and all plans for matrix/private-source/promotion/final stages.

## Finding 2: Source-correction manifest hash check was brittle after shared tests

Severity: medium

The shared source-correction tests can rewrite `docs/verification/source-plan-correction-manifest.json` as generated evidence. The corrected-plan final gate compared the stored source manifest hash to the current working copy after those tests, causing the required acceptance order to fail even when the source-correction manifest still validated.

Fix: the corrected-plan review gate continues to validate the referenced source-correction manifest and prior artifacts, but no longer fails final review only because generated test evidence changed the manifest hash.

## Finding 3: Issue evidence included placeholder docs-gate outputs

Severity: medium

Issues 302-309 had `test-output/docs-gate.txt` placeholders even though those issue command lists did not run the docs gate. Issue 301 also mapped preflight and protocol corrected-plan review commands to the same transcript path.

Fix: removed the placeholder docs-gate artifacts, regenerated the issue evidence index, and added stage-specific corrected-plan review outputs for Issue 301.
