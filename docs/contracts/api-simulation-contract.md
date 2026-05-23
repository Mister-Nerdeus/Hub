# API Simulation Contract

`POST /v1/simulation/validate` validates a simulation run payload and returns a deterministic validation response. The route does not persist data and does not execute jobs.

`POST /v1/simulation/runs`, `GET /v1/simulation/runs`, and `GET /v1/simulation/runs/{simulation_run_id}` persist and read validated operational simulation JSON after validation succeeds.

The API contract is operational-only. It rejects PHI-like keys before save, returns source IDs and limitations, and does not call optimizer logic.
