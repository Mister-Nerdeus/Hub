export type SimulationRunSummaryResponse = {
  id: string;
  simulationRunId: string;
  scenarioId: string;
  createdAt: string;
  updatedAt: string;
};

export type SimulationRunListPagination = {
  limit: number;
  offset: number;
  returned: number;
};

export type SimulationRunListResponse = {
  simulationRuns: SimulationRunSummaryResponse[];
  pagination: SimulationRunListPagination;
};

export class SimulationRunRetrievalApiError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "SimulationRunRetrievalApiError";
    this.code = code;
  }
}

export async function listSimulationRuns(
  apiBaseUrl: string,
  limit = 5,
  fetchImpl: typeof fetch = fetch
): Promise<SimulationRunListResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: "0"
  });
  const apiPath = `${apiBaseUrl.replace(/\/$/, "")}/v1/simulation/runs?${params.toString()}`;
  const response = await fetchImpl(apiPath);
  const body = await readJson(response);

  if (!response.ok) {
    const detail = body && typeof body === "object" ? (body as { detail?: unknown }).detail : undefined;
    if (detail && typeof detail === "object") {
      const structured = detail as { code?: unknown; message?: unknown };
      if (typeof structured.code === "string" && typeof structured.message === "string") {
        throw new SimulationRunRetrievalApiError(structured.message, structured.code);
      }
    }
    throw new SimulationRunRetrievalApiError(`Simulation run list failed with HTTP ${response.status}`);
  }

  return validateListResponse(body);
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function validateListResponse(value: unknown): SimulationRunListResponse {
  if (!value || typeof value !== "object") {
    throw new Error("Simulation run list response must be an object");
  }
  const body = value as Partial<SimulationRunListResponse>;
  if (!Array.isArray(body.simulationRuns)) {
    throw new Error("Simulation run list response must include simulationRuns array");
  }
  if (!body.pagination || typeof body.pagination !== "object") {
    throw new Error("Simulation run list response must include pagination");
  }
  return {
    simulationRuns: body.simulationRuns.map(validateSummary),
    pagination: validatePagination(body.pagination)
  };
}

function validateSummary(value: unknown): SimulationRunSummaryResponse {
  if (!value || typeof value !== "object") {
    throw new Error("Simulation run summary must be an object");
  }
  const summary = value as Partial<SimulationRunSummaryResponse>;
  if (
    typeof summary.id !== "string" ||
    typeof summary.simulationRunId !== "string" ||
    typeof summary.scenarioId !== "string" ||
    typeof summary.createdAt !== "string" ||
    typeof summary.updatedAt !== "string"
  ) {
    throw new Error("Simulation run summary is missing required fields");
  }
  return {
    id: summary.id,
    simulationRunId: summary.simulationRunId,
    scenarioId: summary.scenarioId,
    createdAt: summary.createdAt,
    updatedAt: summary.updatedAt
  };
}

function validatePagination(value: unknown): SimulationRunListPagination {
  const pagination = value as Partial<SimulationRunListPagination>;
  if (
    typeof pagination.limit !== "number" ||
    typeof pagination.offset !== "number" ||
    typeof pagination.returned !== "number"
  ) {
    throw new Error("Simulation run list pagination is missing required fields");
  }
  return {
    limit: pagination.limit,
    offset: pagination.offset,
    returned: pagination.returned
  };
}
