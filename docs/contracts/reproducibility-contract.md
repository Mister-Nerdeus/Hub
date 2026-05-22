# Reproducibility Contract

Simulation and export behavior must be reproducible.

- No unseeded randomness is allowed in simulation logic.
- The same plan, scenario, assumption set, and seed must produce the same simulation output.
- Exported JSON must use deterministic ordering.
- Generated evidence must identify commands, inputs, and known normalization steps.
- Optimizer output must be explainable through the same scoring service used by manual assignment scoring.

When timestamps or generated IDs are unavoidable, tests must normalize them before comparing byte-stable output.
