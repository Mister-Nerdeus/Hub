# Drift Traps

Use this document when a task starts to drift beyond the project boundaries.

## Clinical Language Drift

- Use `occupied room`, not named patients.
- Use `room load` or `abstract patient load`, not diagnoses, chief complaints, or clinical notes.
- Use `simulated operational burden`, not patient outcome prediction.
- Use disclaimers for scoring and reports. Do not imply clinical safety certification.

## Scope Drift

- Do not build simulation before saved plans, scenarios, assignments, and scoring are ready.
- Do not build optimization before the scoring API is complete.
- Do not add EHR import, PHI fields, real patient identity, or clinical documentation workflows.
- Do not persist UI-only selection state in saved plan JSON.

## Contract Drift

- Keep TypeScript schemas, Python contracts, fixtures, and API examples in parity.
- Keep plan exports deterministic with stable ordering.
- Keep coordinate origin, units, grid snapping, and `pixelsPerUnit` conversion rules explicit.
- Keep Phase 7 comparison report-centric. Do not rename `baselineReportId` and `reportIds` back to raw scenario fields such as `baselineScenarioId` or `comparedScenarioIds`; scenario IDs remain in comparison items.

## Evidence Drift

- Do not close an issue with only a summary.
- Include commands, test results, evidence paths, known limitations, and non-PHI confirmation.
- If the user corrects recurring behavior, update the relevant guardrail doc before closing.
