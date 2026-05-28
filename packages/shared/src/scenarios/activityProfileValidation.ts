import {
  ACTIVITY_PROFILE_IDS,
  ACTIVITY_PROFILE_SCHEMA_VERSION,
  type ActivityProfileContract
} from "./activityProfileContract.js";

export function validateActivityProfileContract(profile: ActivityProfileContract): ActivityProfileContract {
  if (profile.schemaVersion !== ACTIVITY_PROFILE_SCHEMA_VERSION) {
    throw new Error("activity profile schema version is unsupported");
  }
  if (!ACTIVITY_PROFILE_IDS.includes(profile.profileId)) {
    throw new Error("activity profile ID is unsupported");
  }
  if (profile.occupancyPercent < 0 || profile.occupancyPercent > 100) {
    throw new Error("activity profile occupancy percentage must be bounded");
  }
  assertPercentDistribution(profile.acuityDistributionPlaceholder, "acuity");
  assertPercentDistribution(profile.complexityDistributionPlaceholder, "complexity");
  if (profile.assumptionsNote !== "synthetic planning input" || !profile.deterministic || !profile.syntheticDataOnly) {
    throw new Error("activity profile must remain a deterministic synthetic planning input");
  }
  if (
    profile.fullShiftSimulationStatus !== "not_started" ||
    profile.outcomeClaim !== false ||
    profile.staffingComplianceClaim !== false
  ) {
    throw new Error("activity profile must not execute simulation, claim outcomes, or claim staffing compliance");
  }
  return profile;
}

function assertPercentDistribution(value: { low: number; medium: number; high: number }, label: string): void {
  const values = [value.low, value.medium, value.high];
  if (values.some((entry) => !Number.isInteger(entry) || entry < 0 || entry > 100)) {
    throw new Error(`activity profile ${label} distribution values must be bounded`);
  }
  const total = value.low + value.medium + value.high;
  if (total !== 100) {
    throw new Error(`activity profile ${label} distribution must total 100`);
  }
}

