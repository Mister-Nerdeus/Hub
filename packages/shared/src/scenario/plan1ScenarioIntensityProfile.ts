import {
  assertNoDuplicateStrings,
  requireExactKeys,
  requireInteger,
  requireLiteralTrue,
  requirePositiveNumber,
  requireRecord,
  requireString
} from "../assignment/plan1AssignmentCommon.js";
import {
  PLAN_1_SIMULATION_ASSUMPTIONS_ID,
  validatePlan1Limitations,
  validatePlan1NonClaims
} from "./plan1SimulationAssumptions.js";

export const PLAN_1_REQUIRED_INTENSITY_PROFILE_IDS = [
  "plan-1-typical",
  "plan-1-busy",
  "plan-1-slammed",
  "plan-1-trauma-heavy",
  "plan-1-walking-heavy"
] as const;

export type Plan1ScenarioIntensityProfileId = (typeof PLAN_1_REQUIRED_INTENSITY_PROFILE_IDS)[number];

export type Plan1ScenarioIntensityProfile = {
  profileId: Plan1ScenarioIntensityProfileId;
  label: string;
  description: string;
  assumptionsId: typeof PLAN_1_SIMULATION_ASSUMPTIONS_ID;
  syntheticDataOnly: true;
  durationMinutes: number;
  taskVolumeMultiplier: number;
  acuityPressureMultiplier: number;
  traumaEventMultiplier: number;
  turnoverMultiplier: number;
  walkingFrictionMultiplier: number;
  interruptionMultiplier: number;
  seedDefault: number;
  limitations: string[];
  nonClaims: string[];
};

const PROFILE_KEYS = [
  "profileId",
  "label",
  "description",
  "assumptionsId",
  "syntheticDataOnly",
  "durationMinutes",
  "taskVolumeMultiplier",
  "acuityPressureMultiplier",
  "traumaEventMultiplier",
  "turnoverMultiplier",
  "walkingFrictionMultiplier",
  "interruptionMultiplier",
  "seedDefault",
  "limitations",
  "nonClaims"
];

const MULTIPLIER_KEYS = [
  "taskVolumeMultiplier",
  "acuityPressureMultiplier",
  "traumaEventMultiplier",
  "turnoverMultiplier",
  "walkingFrictionMultiplier",
  "interruptionMultiplier"
] as const;

export function validatePlan1ScenarioIntensityProfile(value: unknown, index = 0): Plan1ScenarioIntensityProfile {
  const label = `intensityProfiles[${index}]`;
  const record = requireRecord(value, label);
  requireExactKeys(record, label, PROFILE_KEYS);
  const profileId = requireString(record.profileId, `${label}.profileId`);
  if (!(PLAN_1_REQUIRED_INTENSITY_PROFILE_IDS as readonly string[]).includes(profileId)) {
    throw new Error(`${label}.profileId must be a required Plan 1 profile id`);
  }
  const assumptionsId = requireString(record.assumptionsId, `${label}.assumptionsId`);
  if (assumptionsId !== PLAN_1_SIMULATION_ASSUMPTIONS_ID) {
    throw new Error(`${label}.assumptionsId must reference the Plan 1 assumptions register`);
  }
  const description = requireString(record.description, `${label}.description`);
  rejectDemandPredictionText(description, `${label}.description`);
  const profile = {
    profileId: profileId as Plan1ScenarioIntensityProfileId,
    label: requireString(record.label, `${label}.label`),
    description,
    assumptionsId,
    syntheticDataOnly: requireLiteralTrue(record.syntheticDataOnly, `${label}.syntheticDataOnly`),
    durationMinutes: requireInteger(record.durationMinutes, `${label}.durationMinutes`, 1),
    taskVolumeMultiplier: requirePositiveNumber(record.taskVolumeMultiplier, `${label}.taskVolumeMultiplier`),
    acuityPressureMultiplier: requirePositiveNumber(
      record.acuityPressureMultiplier,
      `${label}.acuityPressureMultiplier`
    ),
    traumaEventMultiplier: requirePositiveNumber(record.traumaEventMultiplier, `${label}.traumaEventMultiplier`),
    turnoverMultiplier: requirePositiveNumber(record.turnoverMultiplier, `${label}.turnoverMultiplier`),
    walkingFrictionMultiplier: requirePositiveNumber(
      record.walkingFrictionMultiplier,
      `${label}.walkingFrictionMultiplier`
    ),
    interruptionMultiplier: requirePositiveNumber(record.interruptionMultiplier, `${label}.interruptionMultiplier`),
    seedDefault: requireInteger(record.seedDefault, `${label}.seedDefault`, 0),
    limitations: validatePlan1Limitations(record.limitations, `${label}.limitations`),
    nonClaims: validatePlan1NonClaims(record.nonClaims, `${label}.nonClaims`)
  };
  for (const key of MULTIPLIER_KEYS) {
    if (!Number.isFinite(profile[key]) || profile[key] <= 0) {
      throw new Error(`${label}.${key} must be a finite positive number`);
    }
  }
  return profile;
}

export function validatePlan1ScenarioIntensityProfiles(value: unknown): Plan1ScenarioIntensityProfile[] {
  const record = requireRecord(value, "scenarioIntensityProfiles");
  requireExactKeys(record, "scenarioIntensityProfiles", ["schemaVersion", "planId", "assumptionsId", "profiles"]);
  if (requireString(record.planId, "scenarioIntensityProfiles.planId") !== "default-er-layout-plan-1") {
    throw new Error("scenarioIntensityProfiles.planId must be default-er-layout-plan-1");
  }
  if (requireString(record.assumptionsId, "scenarioIntensityProfiles.assumptionsId") !== PLAN_1_SIMULATION_ASSUMPTIONS_ID) {
    throw new Error("scenarioIntensityProfiles.assumptionsId must reference Plan 1 assumptions");
  }
  const profilesValue = record.profiles;
  if (!Array.isArray(profilesValue)) {
    throw new Error("scenarioIntensityProfiles.profiles must be an array");
  }
  const profiles = profilesValue.map((profile, index) => validatePlan1ScenarioIntensityProfile(profile, index));
  assertNoDuplicateStrings(profiles.map((profile) => profile.profileId), "profileId");
  for (const requiredId of PLAN_1_REQUIRED_INTENSITY_PROFILE_IDS) {
    if (!profiles.some((profile) => profile.profileId === requiredId)) {
      throw new Error(`missing required Plan 1 intensity profile ${requiredId}`);
    }
  }
  return profiles;
}

function rejectDemandPredictionText(value: string, label: string): void {
  if (/\breal demand\b|\bforecast\b|\bpredict(?:s|ed|ion)?\b|\bhistorical\b|\bactual census\b/iu.test(value)) {
    throw new Error(`${label} must not include real-demand or prediction wording`);
  }
}
