# Phase Simulation Execution Checklist

- [x] Simulation run contract validates deterministic IDs, minute offsets, event summaries, limitations, and forbidden wording.
- [x] Deterministic task execution produces validated simulation run outputs.
- [x] Nurse queue ordering is deterministic and explainable.
- [x] Path travel calculation excludes blocked edges and warns on unreachable routes.
- [x] Simulation scoring derives from events and visible named assumptions.
- [x] Simulation operational reports derive from simulation run and score outputs.
- [x] API-free simulation timeline proof surface uses local synthetic fixtures.
- [x] Simulation scenario comparison derives from simulation reports.
- [x] Assignment variant runner uses the same simulation and scoring path.
- [x] Optimizer boundary contract exists before optimizer implementation.
- [x] Baseline optimizer uses shared variant runner and scoring outputs.
- [x] Optimizer audit trail supports deterministic reconstruction.
- [x] API-free optimizer proof surface uses local synthetic fixtures.
- [x] API validation rejects PHI-like payloads and does not persist.
- [x] Simulation persistence validates before save and round-trips JSON.
- [x] Local shared, web, API, no-PHI, docs, and Docker commands are recorded in issue evidence.

No EHR integration, hidden scoring, clinical safety claim, unseeded randomness, PDF export, file download, or GitHub Actions dependency is added by this phase.
