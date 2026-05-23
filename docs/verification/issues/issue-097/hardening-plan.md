# Hardening Plan

## P1-1 TypeScript/Python contract parity

Follow-up: Issue 098

Failure class: shared TypeScript validator and Python API schema disagree on equivalent simulation payloads.

Required proof: canonical parity fixtures are accepted or rejected identically by both validators, and `parity-output.json` records every fixture result.

## P1-2 Missed-task semantics

Follow-up: Issue 099

Failure class: missed tasks outside the shift window do not clearly state whether work was not started or attempted.

Required proof: finite missed reasons are validated, legacy ambiguous reason is rejected, and not-started missed tasks emit no start events or nurse busy minutes.

## P1-3 Queue pause/resume deferral

Follow-up: Issue 100

Failure class: queue validators accept pause/resume actions before the engine implements interruption state.

Required proof: pause/resume actions are rejected in TypeScript and Python while current queue actions remain accepted.

## P1-4 Optimizer candidate constraint adapter

Follow-up: Issue 101

Failure class: optimizer candidates can be created without an explicit constraint step for known tasks, known nurses, and preserved unassigned tasks.

Required proof: adapter rejects unknown references, preserves base unassigned tasks, and all candidates still run through shared variant and scoring paths.

## P1-5 Optimizer assignment reason truth

Follow-up: Issue 102

Failure class: optimizer-generated assignments can be labeled like manual room coverage.

Required proof: manual assignment reason remains valid, optimizer candidate assignments use a distinct source reason, and audit outputs preserve that source.

## P1-6 Persistence read validation and bounded listing

Follow-up: Issue 103

Failure class: persisted simulation JSON can be trusted on read and list responses can grow without explicit bounds.

Required proof: list has default and max limits, offset is supported, valid persisted JSON round-trips, and invalid persisted JSON returns deterministic error content.

## P1-7 Captured command output evidence

Follow-up: Issue 104

Failure class: issue closeout can list commands without non-empty captured output.

Required proof: Issues 104+ fail without at least one non-empty output artifact and `commands.txt` alone is insufficient.

## P1-8 Issue-level evidence index

Follow-up: Issue 105

Failure class: phase evidence gates report broad labels instead of exact issue-level missing evidence.

Required proof: Issues 082+ are indexed with exact required evidence paths, missing or empty paths report the issue number, and index ordering is deterministic.

## P1-9 Dead code and determinism cleanup

Follow-up: Issue 106

Failure class: minor dead/no-op patterns and byte-stability expectations are not locked by explicit cleanup tests.

Required proof: repeated simulation and optimizer outputs serialize identically, existing fixtures remain valid, and cleanup is behavior-preserving.

## Execution Boundary

Issues 098-106 must complete before new feature expansion. The hardening batch does not add new product surface area; it tightens contracts, evidence, and deterministic review proof around the existing operational simulation batch.
