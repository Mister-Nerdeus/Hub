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
  description: string | null
): Promise<PlanRecordResponse> {
  const validLayout = validatePlanContract(layout);
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
  return body as PlanListResponse;
}

export async function getPlan(apiBaseUrl: string, planId: string): Promise<PlanRecordResponse> {
  const response = await fetch(`${apiBaseUrl}/v1/plans/${encodeURIComponent(planId)}`);
  return parsePlanResponse(response);
}

export async function updatePlan(
  apiBaseUrl: string,
  planId: string,
  layout: PlanContract,
  description: string | null
): Promise<PlanRecordResponse> {
  const validLayout = validatePlanContract(layout);
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
  return {
    id: record.id,
    name: record.name,
    description: record.description ?? null,
    layout: validatePlanContract(record.layout),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}
