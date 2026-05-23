# Phase 6 Code Review Findings

## Finding 1: Report proof rows could mislabel duplicate-room unassigned tasks

Severity: medium

The API-free report proof view model treated `unassignedTaskSummary.roomIds` as if it had the same cardinality and order as `unassignedTaskSummary.taskIds`. The report contract defines `roomIds` as a unique room summary, so two unassigned tasks in the same room could render the second row with a blank or mismatched room.

Impact: the proof UI could display incorrect operational inspection details even though the report contract output was valid.

Fix: the view model now derives each unassigned row's room ID from the generated task set by task ID. A duplicate-room fixture path in `reportProofViewModel.test.ts` proves both unassigned task rows retain the correct room ID.

## Finding 2: Contextual report validation accepted incomplete nurse summaries

Severity: medium

The TypeScript and Python operational report validators rejected unknown `nurseSummaries.nurseId` values, but did not require the report to include every nurse from the supplied manual assignment set. A report could omit a known manual-assignment nurse, lower `summary.nurseCount`, and still pass contextual validation.

Impact: contextual report validation did not fully enforce that report references matched the supplied Phase 5 manual assignment context.

Fix: both validators now require the sorted nurse summary IDs to exactly match the manual assignment nurse IDs when `manualAssignmentSet` context is provided. TypeScript and Python contract tests cover the missing-nurse case.

## Residual Risk

No optimizer, reassignment suggestion, task-completion simulation, route calculation, delay calculation, PDF/export, persistence, API endpoint, PHI, EHR integration, or clinical safety certification behavior was added in this review.
