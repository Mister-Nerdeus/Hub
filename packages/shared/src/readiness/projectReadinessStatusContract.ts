export type ProjectReadinessStatus = "complete" | "in_progress" | "blocked";

export type ProjectReadinessStatusContract = {
  itemId: string;
  label: string;
  status: ProjectReadinessStatus;
  scope: "project_readiness_only";
  blockedArea?: "clinical_readiness" | "operational_readiness" | "go_live" | "simulation" | "scoring" | "recommendations";
};

export function validateProjectReadinessStatusContract(value: unknown): ProjectReadinessStatusContract {
  const item = requireRecord(value, "projectReadinessStatus");
  requireAllowedKeys(item, "projectReadinessStatus", ["itemId", "label", "status", "scope", "blockedArea"]);
  if (item.scope !== "project_readiness_only") {
    throw new Error("projectReadinessStatus.scope must be project_readiness_only");
  }
  return {
    itemId: requireString(item.itemId, "projectReadinessStatus.itemId"),
    label: requireString(item.label, "projectReadinessStatus.label"),
    status: requireProjectStatus(item.status),
    scope: "project_readiness_only",
    blockedArea: requireOptionalBlockedArea(item.blockedArea)
  };
}

export const projectReadinessStatusFixture: readonly ProjectReadinessStatusContract[] = [
  { itemId: "geometry-foundation", label: "Geometry foundation", status: "complete", scope: "project_readiness_only" },
  { itemId: "route-graph", label: "Route graph", status: "complete", scope: "project_readiness_only" },
  { itemId: "manual-assignment", label: "Manual assignment", status: "complete", scope: "project_readiness_only" },
  { itemId: "manual-scenario", label: "Manual scenario", status: "complete", scope: "project_readiness_only" },
  { itemId: "manual-review", label: "Manual review", status: "complete", scope: "project_readiness_only" },
  { itemId: "manual-comparison", label: "Manual comparison", status: "complete", scope: "project_readiness_only" },
  { itemId: "simulation-blocked", label: "Simulation blocked", status: "blocked", scope: "project_readiness_only", blockedArea: "simulation" },
  { itemId: "scoring-blocked", label: "Scoring blocked", status: "blocked", scope: "project_readiness_only", blockedArea: "scoring" },
  { itemId: "recommendations-blocked", label: "Recommendations blocked", status: "blocked", scope: "project_readiness_only", blockedArea: "recommendations" }
];

function requireProjectStatus(value: unknown): ProjectReadinessStatus {
  if (value === "complete" || value === "in_progress" || value === "blocked") return value;
  throw new Error("projectReadinessStatus.status must be a project status");
}

function requireOptionalBlockedArea(value: unknown): ProjectReadinessStatusContract["blockedArea"] {
  if (value == null) return undefined;
  if (
    value === "clinical_readiness" ||
    value === "operational_readiness" ||
    value === "go_live" ||
    value === "simulation" ||
    value === "scoring" ||
    value === "recommendations"
  ) {
    return value;
  }
  throw new Error("projectReadinessStatus.blockedArea must be a project blocked area");
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
