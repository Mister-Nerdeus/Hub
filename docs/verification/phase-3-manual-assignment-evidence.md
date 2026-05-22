# Phase 3 Manual Assignment Evidence

Phase 3 proves manual nurse assignment, abstract room load, room burden, nurse burden, and warning output with local synthetic operational data.

## Scope Proven

- Manual assignment contracts for nurses, break windows, assignment sets, and warnings.
- Room-load contract with enum task frequency, burden, and turnover fields.
- Deterministic room workload scoring with visible components.
- Deterministic manual assignment validation warnings.
- Deterministic nurse burden scoring with explicit zero placeholders for systems not yet built.
- API-free web proof surface showing nurses, room assignments, warnings, unassigned occupied rooms, and per-nurse burden.

## Evidence Artifacts

- Checklist: `docs/verification/phase-3-manual-assignment-checklist.md`.
- Room scoring: `docs/verification/issues/issue-034/scoring-output.json`.
- Assignment warnings: `docs/verification/issues/issue-035/warning-output.json`.
- Nurse scoring: `docs/verification/issues/issue-036/scoring-output.json`.
- Web view model output: `docs/verification/issues/issue-037/manual-assignment-output.json`.
- Web screenshot: `docs/verification/issues/issue-037/screenshots/manual-assignment-proof.png`.
- Phase 3 scoring output: `docs/verification/issues/issue-038/scoring-output.json`.
- Phase 3 warning output: `docs/verification/issues/issue-038/warning-output.json`.
- Phase 3 screenshot: `docs/verification/issues/issue-038/screenshots/manual-assignment-proof.png`.

## Boundary Confirmation

No PHI, patient identity, diagnosis text, clinical notes, EHR integration, clinical safety certification language, full-shift simulation, optimizer, or hidden scoring model was added.

The proof supports the Phase 3 thesis: four occupied rooms are not automatically four equal operational burdens.
