# Operational Summary Report Builder Contract

Phase 6 report builders are pure deterministic transforms from Phase 5 outputs into validated `OperationalReportContract` objects.

## Inputs

```text
{
  scenario: ShiftScenarioContract;
  generatedTaskSet: GeneratedOperationalTaskSetContract;
  timelineSummary: TaskTimelineSummary;
  nurseTaskAssignmentResult: BasicNurseTaskAssignmentResult;
  manualAssignmentSet: ManualAssignmentContract;
  createdAt?: string;
}
```

## Builders

- `buildOperationalSummaryReport(input)` returns report type `operational_summary`.
- `buildNurseWorkloadReport(input)` returns report type `nurse_workload`.

## Required Behavior

- Validate input contracts before building reports.
- Generate deterministic report IDs.
- Use the deterministic proof timestamp when `createdAt` is omitted.
- Use explicit `createdAt` input exactly when supplied.
- Reject invalid explicit `createdAt` input through final report validation.
- Use only supplied Phase 5 outputs.
- Compute summary counts from generated tasks and nurse task assignments.
- Compute nurse summaries from per-nurse task counts and estimated task minutes.
- Compute warning summaries from supplied warnings.
- Compute unassigned summaries from unassigned task assignments.
- Validate the final report with `validateOperationalReportContract`.

## Boundaries

- No UI, API endpoint, persistence, PDF export, optimizer, task-completion simulation, walking route calculation, or delay calculation.
- No staffing certification or clinical adequacy language.
- Output remains a synthetic operational inspection summary only.
