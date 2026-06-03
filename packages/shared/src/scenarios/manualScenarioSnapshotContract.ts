export type ManualScenarioSnapshotContract = {
  scenarioSnapshotId: string;
  scenarioId: string;
  floorplanId: string;
  assignmentSetId: string;
  staffRosterId?: string;
  floorplanRevisionId?: string;
  assignmentSetRevisionId?: string;
  createdAtIso: string;
  mode: "manual_snapshot";
};

export function manualScenarioSnapshotIdFor(input: {
  scenarioId: string;
  floorplanId: string;
  assignmentSetId: string;
  floorplanRevisionId?: string;
  assignmentSetRevisionId?: string;
}): string {
  return [
    "manual-scenario-snapshot",
    stableIdPart(input.scenarioId),
    stableIdPart(input.floorplanId),
    stableIdPart(input.assignmentSetId),
    stableIdPart(input.floorplanRevisionId ?? "no-floorplan-revision"),
    stableIdPart(input.assignmentSetRevisionId ?? "no-assignment-revision")
  ].join(":");
}

export function validateManualScenarioSnapshotContract(value: unknown): ManualScenarioSnapshotContract {
  const snapshot = requireRecord(value, "manualScenarioSnapshot");
  requireAllowedKeys(snapshot, "manualScenarioSnapshot", [
    "scenarioSnapshotId",
    "scenarioId",
    "floorplanId",
    "assignmentSetId",
    "staffRosterId",
    "floorplanRevisionId",
    "assignmentSetRevisionId",
    "createdAtIso",
    "mode"
  ]);
  if (snapshot.mode !== "manual_snapshot") {
    throw new Error("manualScenarioSnapshot.mode must be manual_snapshot");
  }
  const scenarioId = requireString(snapshot.scenarioId, "manualScenarioSnapshot.scenarioId");
  const floorplanId = requireString(snapshot.floorplanId, "manualScenarioSnapshot.floorplanId");
  const assignmentSetId = requireString(snapshot.assignmentSetId, "manualScenarioSnapshot.assignmentSetId");
  const floorplanRevisionId = optionalString(snapshot.floorplanRevisionId, "manualScenarioSnapshot.floorplanRevisionId");
  const assignmentSetRevisionId = optionalString(
    snapshot.assignmentSetRevisionId,
    "manualScenarioSnapshot.assignmentSetRevisionId"
  );
  const scenarioSnapshotId = requireString(snapshot.scenarioSnapshotId, "manualScenarioSnapshot.scenarioSnapshotId");
  const expectedSnapshotId = manualScenarioSnapshotIdFor({
    scenarioId,
    floorplanId,
    assignmentSetId,
    ...(floorplanRevisionId == null ? {} : { floorplanRevisionId }),
    ...(assignmentSetRevisionId == null ? {} : { assignmentSetRevisionId })
  });
  if (scenarioSnapshotId !== expectedSnapshotId) {
    throw new Error("manualScenarioSnapshot.scenarioSnapshotId must be deterministic");
  }
  return {
    scenarioSnapshotId,
    scenarioId,
    floorplanId,
    assignmentSetId,
    ...(snapshot.staffRosterId == null ? {} : {
      staffRosterId: requireString(snapshot.staffRosterId, "manualScenarioSnapshot.staffRosterId")
    }),
    ...(floorplanRevisionId == null ? {} : { floorplanRevisionId }),
    ...(assignmentSetRevisionId == null ? {} : { assignmentSetRevisionId }),
    createdAtIso: requireIso(snapshot.createdAtIso, "manualScenarioSnapshot.createdAtIso"),
    mode: "manual_snapshot"
  };
}

function stableIdPart(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");
  return normalized.length === 0 ? "unnamed" : normalized;
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireAllowedKeys(value: Record<string, unknown>, label: string, allowedKeys: readonly string[]): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new Error(`${label}.${key} is not allowed`);
    }
  }
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function optionalString(value: unknown, label: string): string | undefined {
  return value == null ? undefined : requireString(value, label);
}

function requireIso(value: unknown, label: string): string {
  const text = requireString(value, label);
  if (Number.isNaN(Date.parse(text))) {
    throw new Error(`${label} must be an ISO date string`);
  }
  return text;
}
