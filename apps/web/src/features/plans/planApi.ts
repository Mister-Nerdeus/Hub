import { validatePlanContract, type PlanContract } from "@nerdeus/shared";

export type PlanRecordResponse = {
  id: string;
  name: string;
  description: string | null;
  layout: PlanContract;
  createdAt: string;
  updatedAt: string;
};

export type PlanSummaryResponse = Omit<PlanRecordResponse, "layout">;

export type PlanListResponse = {
  plans: PlanSummaryResponse[];
};

export async function createPlan(
  apiBaseUrl: string,
  layout: PlanContract,
  description: string | null = layout.description ?? null
): Promise<PlanRecordResponse> {
  const validLayout = validatePlanContract(layout);
  assertDescriptionMatchesLayout(description, validLayout);
  const response = await fetch(`${apiBaseUrl}/v1/plans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description, layout: validLayout })
  });
  return parsePlanResponse(response);
}

export async function listPlans(apiBaseUrl: string): Promise<PlanListResponse> {
  const response = await fetch(`${apiBaseUrl}/v1/plans`);
  if (!response.ok) {
    throw new Error(`List plans failed with HTTP ${response.status}`);
  }
  const body = await response.json();
  if (!body || !Array.isArray(body.plans)) {
    throw new Error("List plans response must include plans array");
  }
  return { plans: body.plans.map(validatePlanSummary) };
}

export async function getPlan(apiBaseUrl: string, planId: string): Promise<PlanRecordResponse> {
  const response = await fetch(`${apiBaseUrl}/v1/plans/${encodeURIComponent(planId)}`);
  return parsePlanResponse(response);
}

export async function updatePlan(
  apiBaseUrl: string,
  planId: string,
  layout: PlanContract,
  description: string | null = layout.description ?? null
): Promise<PlanRecordResponse> {
  const validLayout = validatePlanContract(layout);
  assertDescriptionMatchesLayout(description, validLayout);
  const response = await fetch(`${apiBaseUrl}/v1/plans/${encodeURIComponent(planId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description, layout: validLayout })
  });
  return parsePlanResponse(response);
}

async function parsePlanResponse(response: Response): Promise<PlanRecordResponse> {
  if (!response.ok) {
    throw new Error(`Plan request failed with HTTP ${response.status}`);
  }
  const body = await response.json();
  if (!body || typeof body !== "object") {
    throw new Error("Plan response must be an object");
  }
  const record = body as Partial<PlanRecordResponse>;
  if (
    typeof record.id !== "string" ||
    typeof record.name !== "string" ||
    typeof record.createdAt !== "string" ||
    typeof record.updatedAt !== "string" ||
    !("layout" in record)
  ) {
    throw new Error("Plan response is missing required fields");
  }
  if (
    record.description !== null &&
    record.description !== undefined &&
    typeof record.description !== "string"
  ) {
    throw new Error("Plan response description must be a string or null");
  }
  const layout = validatePlanContract(record.layout);
  if (record.id !== layout.planId) {
    throw new Error("Plan response id must match layout.planId");
  }
  if (record.name !== layout.name) {
    throw new Error("Plan response name must match layout.name");
  }
  const description = record.description ?? null;
  if (description !== (layout.description ?? null)) {
    throw new Error("Plan response description must match layout.description");
  }
  return {
    id: record.id,
    name: record.name,
    description,
    layout,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function assertDescriptionMatchesLayout(description: string | null, layout: PlanContract): void {
  if (description !== (layout.description ?? null)) {
    throw new Error("Plan request description must match layout.description");
  }
}

function validatePlanSummary(value: unknown): PlanSummaryResponse {
  if (!value || typeof value !== "object") {
    throw new Error("Plan summary must be an object");
  }
  const summary = value as Partial<PlanSummaryResponse>;
  if (
    typeof summary.id !== "string" ||
    typeof summary.name !== "string" ||
    typeof summary.createdAt !== "string" ||
    typeof summary.updatedAt !== "string"
  ) {
    throw new Error("Plan summary is missing required fields");
  }
  if (
    summary.description !== null &&
    summary.description !== undefined &&
    typeof summary.description !== "string"
  ) {
    throw new Error("Plan summary description must be a string or null");
  }
  return {
    id: summary.id,
    name: summary.name,
    description: summary.description ?? null,
    createdAt: summary.createdAt,
    updatedAt: summary.updatedAt
  };
}
