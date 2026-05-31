# Batch 704-741 Code Review

Date: 2026-05-31

Scope:

- Option A product shell: compact left rail plus full top workflow stepper.
- Active floorplan hub/readiness/persistence resilience.
- Durable assignment set, nurse profile, room load, manual assignment, and scenario handoff foundation.
- Docker revision label and production runtime verification.

Findings fixed:

- Normal Manual Assignment still had a reachable synthetic fallback path when active layout context was missing. Fixed by routing normal-mode missing context through `ManualAssignmentBlockedState` and keeping synthetic fixtures marked developer/evidence only.
- Inactive nurse deactivation removed existing assignments instead of preserving them for review. Fixed by preserving existing assignments, blocking new inactive assignments in the reducer, and emitting `INACTIVE_NURSE_ASSIGNMENT_REVIEW`.
- Inspector normal mode still exposed technical record details. Fixed by moving Object ID, source units, raw validation, and record IDs behind `InspectorAdvancedDetails`.
- Scenario foundation could show assignment context without an explicit missing-assignment block. Fixed with `ScenarioHandoffGate`, selected floorplan/assignment context, warning display, and no simulation/optimizer markers.
- Batch wiring and Docker metadata were stale for 704-713. Fixed by replacing root scripts/validators/manifest/status with 704-741 wiring and updating Docker revision labels to `editor-assignment-ux-704-741`.

Residual review notes:

- Screenshots in per-issue evidence are placeholder local artifacts emitted by validators; test/build/Docker outputs are the primary local proof.
- Scenario, Simulation, Reports, optimizer, recommendations, clinical safety scoring, staffing compliance certification, patient outcome prediction, PHI workflows, and EHR integration remain intentionally out of scope.

Verification:

- `npm --workspace packages/shared test`: passed.
- `npm --workspace apps/web test`: passed.
- `npm --workspace apps/web run build`: passed.
- 704-740 editor/assignment validators: passed.
- Issue 741 GO/NO-GO audit: passed.
- Active floorplan, door, and split-room regressions under Issue 741: passed.
- `node scripts/check-no-phi-fields.mjs`: passed.
- `node scripts/check-production-docker-runtime.mjs --smoke`: passed.
