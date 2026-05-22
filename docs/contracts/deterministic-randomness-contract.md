# Deterministic Randomness Contract

Seeded randomness is required for reproducible operational generation. `createSeededRandom(seed)` is the shared deterministic random utility for Phase 4 and later simulation work.

## API

```text
createSeededRandom(seed): SeededRandom

SeededRandom
nextFloat(): number
nextInt(minInclusive, maxExclusive): number
pick(items): item
shuffle(items): item[]
```

## Algorithm

The implementation uses a small SplitMix64-style BigInt PRNG. It uses no external dependency and no `Math.random()`.

## Validation

- Seed must be a non-negative safe integer.
- Same seed produces the same sequence.
- Different seeds produce different sequences where randomness is used.
- `nextFloat()` returns values in `[0, 1)`.
- `nextInt()` uses an exclusive upper bound.
- `pick([])` throws a clear error.
- `shuffle()` does not mutate its input.

## Boundaries

The utility does not generate tasks, simulate a shift, optimize assignments, or introduce hidden assumptions.
