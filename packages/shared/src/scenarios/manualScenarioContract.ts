export type ManualScenarioContract = {
  scenarioId: string;
  label: string;
  description?: string;
  floorplanId: string;
  assignmentSetId: string;
  staffRosterId: string;
  createdAtIso: string;
  updatedAtIso: string;
  mode: "manual";
};

export function manualScenarioIdFor(input: {
  stableSeed: string;
}): string {
  return ["manual-scenario", stableIdPart(input.stableSeed)].join(":");
}

function stableIdPart(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");
  return normalized.length === 0 ? "unnamed" : normalized;
}
