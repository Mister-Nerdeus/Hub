# 2026-05-22 Post-Gate Code Review Findings

## Fixed Findings

1. Evidence artifacts were outside the no-PHI scanner.

   `scripts/check-no-phi-fields.mjs` skipped `docs/verification/`, even though local evidence artifacts are the source of truth for closeout. A direct scan of `docs/verification/` produced no current PHI-like field matches, so the blanket skip was removed.

2. Evidence output mode used raw path equality.

   `scripts/generate-local-evidence-pack.mjs` compared custom output paths to the tracked evidence path with raw string equality. On Windows, equivalent paths with different casing could be written to the tracked location while being labeled `custom`. The check now uses the existing normalized same-path helper and the mixed-case tracked output proof reports `outputMode: tracked`.

## Reviewed Areas

- Local evidence pack output selection and manifest generation.
- Docs contract gate enforcement.
- Non-PHI scanner coverage.
- Shared manual assignment validation and nurse burden scoring.
- API plan persistence and Docker smoke path.
- Web manual assignment proof surface.

## Residual Risk

No unresolved code-review findings remain from this pass. The no-PHI scanner still searches for PHI-like field names and does not inspect binary screenshot pixels.

