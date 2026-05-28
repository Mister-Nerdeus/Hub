export const ACTIVITY_PROFILE_SCHEMA_VERSION = "1.0.0" as const;
export const ACTIVITY_PROFILE_IDS = ["typical", "busy", "slammed"] as const;
export type ActivityProfileId = (typeof ACTIVITY_PROFILE_IDS)[number];

export type ActivityProfileContract = {
  schemaVersion: typeof ACTIVITY_PROFILE_SCHEMA_VERSION;
  profileId: ActivityProfileId;
  label: "Typical" | "Busy" | "Slammed";
  occupancyPercent: number;
  acuityDistributionPlaceholder: {
    low: number;
    medium: number;
    high: number;
  };
  complexityDistributionPlaceholder: {
    low: number;
    medium: number;
    high: number;
  };
  taskIntensityPlaceholder: "low" | "medium" | "high";
  assumptionsNote: "synthetic planning input";
  deterministic: true;
  fullShiftSimulationStatus: "not_started";
  outcomeClaim: false;
  staffingComplianceClaim: false;
  syntheticDataOnly: true;
};

export const typicalActivityProfile: ActivityProfileContract = {
  schemaVersion: ACTIVITY_PROFILE_SCHEMA_VERSION,
  profileId: "typical",
  label: "Typical",
  occupancyPercent: 65,
  acuityDistributionPlaceholder: { low: 35, medium: 50, high: 15 },
  complexityDistributionPlaceholder: { low: 45, medium: 45, high: 10 },
  taskIntensityPlaceholder: "medium",
  assumptionsNote: "synthetic planning input",
  deterministic: true,
  fullShiftSimulationStatus: "not_started",
  outcomeClaim: false,
  staffingComplianceClaim: false,
  syntheticDataOnly: true
};

export const busyActivityProfile: ActivityProfileContract = {
  ...typicalActivityProfile,
  profileId: "busy",
  label: "Busy",
  occupancyPercent: 85,
  acuityDistributionPlaceholder: { low: 25, medium: 55, high: 20 },
  complexityDistributionPlaceholder: { low: 30, medium: 50, high: 20 },
  taskIntensityPlaceholder: "high"
};

export const slammedActivityProfile: ActivityProfileContract = {
  ...typicalActivityProfile,
  profileId: "slammed",
  label: "Slammed",
  occupancyPercent: 100,
  acuityDistributionPlaceholder: { low: 15, medium: 55, high: 30 },
  complexityDistributionPlaceholder: { low: 20, medium: 45, high: 35 },
  taskIntensityPlaceholder: "high"
};

export const activityProfileContracts = [
  typicalActivityProfile,
  busyActivityProfile,
  slammedActivityProfile
] as const;

