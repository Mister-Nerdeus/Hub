# Reproducibility Contract

Simulation and export behavior must be reproducible.

- No unseeded randomness is allowed in simulation logic.
- The same plan, scenario, assumption set, task templates, day profile, and seed must produce the same generated operational task output.
- `createSeededRandom(seed)` is the shared deterministic utility for random ordering, timing offsets, picks, and shuffles.
- `Math.random()` must not be used in deterministic operational task generation or later simulation logic.
- Exported JSON must use deterministic ordering.
- Plan JSON must preserve deterministic ordering for rooms, hallways, doors, nurse stations, zones, path nodes, and path edges.
- Walking graph references must be validated so later scoring can use path distance instead of straight-line distance.
- Generated evidence must identify commands, inputs, seeds, and known normalization steps.
- Optimizer output must be explainable through the same scoring service used by manual assignment scoring.

When timestamps or generated IDs are unavoidable, tests must normalize them before comparing byte-stable output.
