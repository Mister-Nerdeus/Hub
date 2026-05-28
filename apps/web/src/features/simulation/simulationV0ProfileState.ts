import {
  activityProfileContracts,
  neutralWorkloadSeedContract,
  type ActivityProfileContract,
  type ActivityProfileId,
  type NeutralWorkloadSeedContract
} from "@nerdeus/shared";

export type SimulationV0ActivityProfileOption = ActivityProfileId;

export type SimulationV0ActivityProfileMetadata = {
  id: SimulationV0ActivityProfileOption;
  label: ActivityProfileContract["label"];
  occupancyPercent: number;
  syntheticWorkloadNote: string;
  limitationCopy: string;
  deterministicSeedReference: string;
};

export const simulationV0ActivityProfileMetadata: readonly SimulationV0ActivityProfileMetadata[] =
  activityProfileContracts.map((profile) => ({
    id: profile.profileId,
    label: profile.label,
    occupancyPercent: profile.occupancyPercent,
    syntheticWorkloadNote: `${profile.taskIntensityPlaceholder} synthetic placeholder workload`,
    limitationCopy: "Synthetic operational activity profile only.",
    deterministicSeedReference: buildNeutralWorkloadSeedForActivityProfile(profile.profileId).seedValue
  }));

export function getSimulationV0ActivityProfile(profileId: ActivityProfileId): ActivityProfileContract {
  const profile = activityProfileContracts.find((candidate) => candidate.profileId === profileId);
  if (profile == null) {
    throw new Error("Simulation v0 activity profile is not allowed");
  }
  return profile;
}

export function buildNeutralWorkloadSeedForActivityProfile(
  profileId: ActivityProfileId
): NeutralWorkloadSeedContract {
  return {
    ...neutralWorkloadSeedContract,
    activityProfileId: profileId,
    seedValue:
      profileId === "typical"
        ? neutralWorkloadSeedContract.seedValue
        : `${neutralWorkloadSeedContract.seedValue}-${profileId}`
  };
}
