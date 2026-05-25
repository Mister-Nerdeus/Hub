import { PLAN_1_ID } from "../assignment/plan1AssignmentCommon.js";
import { validatePlan1Limitations, validatePlan1NonClaims } from "../scenario/plan1SimulationAssumptions.js";

export type Plan1DemoSeedId =
  | "demo-plan-1-typical"
  | "demo-plan-1-slammed"
  | "demo-plan-1-walking-heavy"
  | "demo-plan-1-trauma-heavy"
  | "demo-plan-1-comparison";

export type Plan1DemoSeed = {
  demoSeedId: Plan1DemoSeedId;
  label: string;
  description: string;
  profileId: string;
  seed: number;
  durationMinutes: number;
  expectedSignals: string[];
  limitations: string[];
  nonClaims: string[];
  syntheticDataOnly: true;
};

export type Plan1DemoSeedPack = {
  packId: "plan-1-demo-seed-pack-v1";
  planId: typeof PLAN_1_ID;
  seeds: Plan1DemoSeed[];
};

export type Plan1DemoSeedPackSummary = {
  packId: Plan1DemoSeedPack["packId"];
  planId: typeof PLAN_1_ID;
  seedCount: number;
  demoSeedIds: Plan1DemoSeedId[];
  profileIds: string[];
  expectedSignals: string[];
  limitations: string[];
  nonClaims: string[];
  syntheticDataOnly: true;
};

const REQUIRED_DEMO_SEED_IDS: Plan1DemoSeedId[] = [
  "demo-plan-1-typical",
  "demo-plan-1-slammed",
  "demo-plan-1-walking-heavy",
  "demo-plan-1-trauma-heavy",
  "demo-plan-1-comparison"
];

const REQUIRED_EXPECTED_SIGNALS = [
  "higher synthetic task pressure",
  "more deferred synthetic work",
  "higher approximate walking load",
  "larger queue-depth signal",
  "proof report available"
];

export function validatePlan1DemoSeedPack(value: unknown): Plan1DemoSeedPack {
  if (value == null || typeof value !== "object") {
    throw new Error("Plan 1 demo seed pack must be an object");
  }
  const candidate = value as Record<string, unknown>;
  if (candidate.packId !== "plan-1-demo-seed-pack-v1") {
    throw new Error("Plan 1 demo seed pack has unexpected packId");
  }
  if (candidate.planId !== PLAN_1_ID) {
    throw new Error("Plan 1 demo seed pack must target default-er-layout-plan-1");
  }
  if (!Array.isArray(candidate.seeds)) {
    throw new Error("Plan 1 demo seed pack requires seeds array");
  }
  const seeds = candidate.seeds.map(validatePlan1DemoSeed);
  assertRequiredDemoSeeds(seeds);
  return {
    packId: "plan-1-demo-seed-pack-v1",
    planId: PLAN_1_ID,
    seeds
  };
}

export function buildPlan1DemoSeedPackSummary(seedPack: Plan1DemoSeedPack): Plan1DemoSeedPackSummary {
  const expectedSignals = [...new Set(seedPack.seeds.flatMap((seed) => seed.expectedSignals))].sort();
  const limitations = [...new Set(seedPack.seeds.flatMap((seed) => seed.limitations))].sort();
  const nonClaims = [...new Set(seedPack.seeds.flatMap((seed) => seed.nonClaims))].sort();
  for (const signal of REQUIRED_EXPECTED_SIGNALS) {
    if (!expectedSignals.includes(signal)) {
      throw new Error(`Plan 1 demo seed pack missing expected signal: ${signal}`);
    }
  }
  return {
    packId: seedPack.packId,
    planId: seedPack.planId,
    seedCount: seedPack.seeds.length,
    demoSeedIds: seedPack.seeds.map((seed) => seed.demoSeedId),
    profileIds: [...new Set(seedPack.seeds.map((seed) => seed.profileId))].sort(),
    expectedSignals,
    limitations,
    nonClaims,
    syntheticDataOnly: true
  };
}

function validatePlan1DemoSeed(value: unknown): Plan1DemoSeed {
  if (value == null || typeof value !== "object") {
    throw new Error("Plan 1 demo seed must be an object");
  }
  const candidate = value as Record<string, unknown>;
  const demoSeedId = candidate.demoSeedId;
  if (typeof demoSeedId !== "string" || !REQUIRED_DEMO_SEED_IDS.includes(demoSeedId as Plan1DemoSeedId)) {
    throw new Error("Plan 1 demo seed has unknown demoSeedId");
  }
  if (typeof candidate.label !== "string" || candidate.label.length === 0) {
    throw new Error("Plan 1 demo seed requires label");
  }
  if (typeof candidate.description !== "string" || candidate.description.length === 0) {
    throw new Error("Plan 1 demo seed requires description");
  }
  if (typeof candidate.profileId !== "string" || !candidate.profileId.startsWith("plan-1-")) {
    throw new Error("Plan 1 demo seed requires Plan 1 profileId");
  }
  const seedValue = candidate.seed;
  if (typeof seedValue !== "number" || !Number.isInteger(seedValue)) {
    throw new Error("Plan 1 demo seed requires integer seed");
  }
  const durationMinutes = candidate.durationMinutes;
  if (typeof durationMinutes !== "number" || !Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new Error("Plan 1 demo seed requires positive durationMinutes");
  }
  if (!Array.isArray(candidate.expectedSignals) || candidate.expectedSignals.some((signal) => typeof signal !== "string")) {
    throw new Error("Plan 1 demo seed requires expectedSignals");
  }
  if (candidate.syntheticDataOnly !== true) {
    throw new Error("Plan 1 demo seed must set syntheticDataOnly true");
  }
  return {
    demoSeedId: demoSeedId as Plan1DemoSeedId,
    label: candidate.label,
    description: candidate.description,
    profileId: candidate.profileId,
    seed: seedValue,
    durationMinutes,
    expectedSignals: [...candidate.expectedSignals],
    limitations: validatePlan1Limitations(candidate.limitations, `${demoSeedId}.limitations`),
    nonClaims: validatePlan1NonClaims(candidate.nonClaims, `${demoSeedId}.nonClaims`),
    syntheticDataOnly: true
  };
}

function assertRequiredDemoSeeds(seeds: Plan1DemoSeed[]): void {
  const ids = new Set(seeds.map((seed) => seed.demoSeedId));
  for (const required of REQUIRED_DEMO_SEED_IDS) {
    if (!ids.has(required)) {
      throw new Error(`Plan 1 demo seed pack missing ${required}`);
    }
  }
  if (ids.size !== seeds.length) {
    throw new Error("Plan 1 demo seed pack has duplicate demoSeedId values");
  }
}
