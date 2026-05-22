# Reproducibility Contract

Simulation and export behavior must be reproducible.

- No unseeded randomness is allowed in simulation logic.
- The same plan, scenario, assumption set, and seed must produce the same simulation output.
- Exported JSON must use deterministic ordering.
- Plan JSON must preserve deterministic ordering for rooms, hallways, doors, nurse stations, zones, path nodes, and path edges.
- Walking graph references must be validated so later scoring can use path distance instead of straight-line distance.
- Generated evidence must identify commands, inputs, and known normalization steps.
- Optimizer output must be explainable through the same scoring service used by manual assignment scoring.

When timestamps or generated IDs are unavoidable, tests must normalize them before comparing byte-stable output.
