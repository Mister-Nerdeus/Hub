import { createSeededRandom } from "../random/seededRandom.js";
import {
  type DeterministicDryRunSeedContract,
  validateDeterministicDryRunSeedContract
} from "./deterministicSeedContract.js";

export function stableDryRunHash(input: string): number {
  if (input.length === 0) {
    throw new Error("stableDryRunHash requires a non-empty input");
  }
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

export function createDeterministicDryRunSequence(
  contract: DeterministicDryRunSeedContract,
  namespace: string,
  count: number
): number[] {
  const seed = validateDeterministicDryRunSeedContract(contract);
  if (namespace.length === 0) {
    throw new Error("deterministic dry-run sequence requires a namespace");
  }
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new Error("deterministic dry-run sequence count must be a non-negative integer");
  }
  const numericSeed = stableDryRunHash(
    [
      seed.seedValue,
      seed.canonicalScenarioSeedId,
      seed.activityProfileId,
      seed.ratioPresetId,
      namespace
    ].join("|")
  );
  const random = createSeededRandom(numericSeed);
  return Array.from({ length: count }, () => random.nextInt(0, 1_000_000));
}
