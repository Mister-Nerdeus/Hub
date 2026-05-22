# Operational Report Contract

Phase 6 reports are operational inspection summaries for already-generated deterministic task workload outputs. They summarize Phase 5 data only:

- Generated operational task set.
- Task timeline summary.
- Manual-coverage nurse task assignment result.
- Warnings.
- Unassigned tasks.
- Per-nurse estimated task minutes.

Reports do not certify staffing, clinical adequacy, outcomes, completed work, route accuracy, delay prediction, or optimized assignment.

## Report Types

```text
operational_summary
nurse_workload
unassigned_tasks
warnings
```

## Required Shape

```text
OperationalReportContract
  schemaVersion: "1.0.0"
  reportId: non-empty string
  reportType: ReportType
  scenarioId: string
  generatedTaskSetId: string
  nurseTaskAssignmentSetId: string
  createdAt: ISO-compatible timestamp
  title: string
  summary: OperationalReportSummary
  nurseSummaries: NurseOperationalSummary[]
  timelineSummary: ReportTimelineSummary
  warningSummary: ReportWarningSummary
  unassignedTaskSummary: ReportUnassignedTaskSummary
  limitations: string[]
```

## Validation Rules

- Report IDs must be non-empty.
- `createdAt` must parse as an ISO-compatible timestamp.
- Counts must be non-negative integers.
- Estimated task minutes must be non-negative.
- `summary.assignedTaskCount + summary.unassignedTaskCount` must equal `summary.totalGeneratedTasks`.
- `summary.warningCount` must equal warning severity totals.
- `summary.nurseCount` must equal `nurseSummaries.length`.
- When context is supplied, `scenarioId`, `generatedTaskSetId`, and `nurseTaskAssignmentSetId` must match the referenced objects.
- When a generated task set is supplied, total task count, total estimated minutes, timeline summary, and unassigned task IDs must match it.
- When a nurse task assignment set is supplied, assigned and unassigned task counts must match task assignments.
- When a manual assignment set is supplied, nurse summaries must reference known nurses.
- When warnings are supplied, warning severity counts, warning code counts, and per-nurse warning counts must match.
- Limitations must include operational-only language, no optimizer, no task-completion simulation, and no walking route calculation.
- Report text rejects safety certification, clinical adequacy, diagnosis, treatment, clinical note, patient name, EHR, patient outcome, completed work, walking route accuracy, and delay prediction language.

## Scope Boundaries

- No report builder is required by this contract alone.
- No UI, API endpoint, PDF export, persistence, optimizer, task-completion simulation, walking route calculation, or delay calculation is part of this contract.
- TypeScript and Python validators must agree using shared fixtures.
