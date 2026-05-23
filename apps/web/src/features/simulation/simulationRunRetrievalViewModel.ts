import type {
  SimulationRunListPagination,
  SimulationRunSummaryResponse
} from "./simulationRunRetrievalApi";

export const simulationRunRetrievalLimitations = [
  "Proof surface only; not a production workflow.",
  "Displays validated simulation run summaries only.",
  "No identity fields are requested or displayed.",
  "No save, edit, export, or optimizer action is performed."
];

export type SimulationRunRetrievalInput =
  | {
      status: "loading";
    }
  | {
      status: "ready";
      runs: SimulationRunSummaryResponse[];
      pagination: SimulationRunListPagination;
    }
  | {
      status: "error";
      message: string;
      code?: string;
    };

export type SimulationRunRetrievalViewModel = {
  status: "loading" | "empty" | "ready" | "error";
  statusText: string;
  rows: Array<{
    id: string;
    simulationRunId: string;
    scenarioId: string;
    updatedAt: string;
  }>;
  paginationText: string;
  errorCode: string | null;
  errorMessage: string | null;
  limitations: string[];
};

export function createSimulationRunRetrievalViewModel(
  input: SimulationRunRetrievalInput
): SimulationRunRetrievalViewModel {
  if (input.status === "loading") {
    return {
      status: "loading",
      statusText: "Loading simulation runs",
      rows: [],
      paginationText: "Limit 5, offset 0",
      errorCode: null,
      errorMessage: null,
      limitations: [...simulationRunRetrievalLimitations]
    };
  }
  if (input.status === "error") {
    return {
      status: "error",
      statusText: "Retrieval error",
      rows: [],
      paginationText: "Limit 5, offset 0",
      errorCode: input.code ?? null,
      errorMessage: input.message,
      limitations: [...simulationRunRetrievalLimitations]
    };
  }
  const rows = input.runs.map((run) => ({
    id: run.id,
    simulationRunId: run.simulationRunId,
    scenarioId: run.scenarioId,
    updatedAt: run.updatedAt
  }));
  return {
    status: rows.length === 0 ? "empty" : "ready",
    statusText: rows.length === 0 ? "No simulation runs found" : "Simulation runs loaded",
    rows,
    paginationText: `Limit ${input.pagination.limit}, offset ${input.pagination.offset}, returned ${input.pagination.returned}`,
    errorCode: null,
    errorMessage: null,
    limitations: [...simulationRunRetrievalLimitations]
  };
}
