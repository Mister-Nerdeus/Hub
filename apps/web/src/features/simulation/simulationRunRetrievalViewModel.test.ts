import {
  listSimulationRuns,
  SimulationRunRetrievalApiError
} from "./simulationRunRetrievalApi";
import {
  createSimulationRunRetrievalViewModel,
  simulationRunRetrievalLimitations
} from "./simulationRunRetrievalViewModel";

const successViewModel = createSimulationRunRetrievalViewModel({
  status: "ready",
  runs: [
    {
      id: "simulation-run-proof",
      simulationRunId: "simulation-run-proof",
      scenarioId: "shift-scenario-basic",
      createdAt: "2026-05-23T00:00:00.000Z",
      updatedAt: "2026-05-23T00:00:00.000Z"
    }
  ],
  pagination: { limit: 5, offset: 0, returned: 1 }
});

if (successViewModel.status !== "ready") {
  throw new Error("success view model should be ready");
}

if (successViewModel.rows[0]?.simulationRunId !== "simulation-run-proof") {
  throw new Error("success view model should expose simulation run row");
}

const emptyViewModel = createSimulationRunRetrievalViewModel({
  status: "ready",
  runs: [],
  pagination: { limit: 5, offset: 0, returned: 0 }
});

if (emptyViewModel.status !== "empty") {
  throw new Error("empty list should produce empty status");
}

const errorViewModel = createSimulationRunRetrievalViewModel({
  status: "error",
  code: "PERSISTED_SIMULATION_RUN_INVALID",
  message: "persisted simulation run failed validation"
});

if (errorViewModel.status !== "error" || errorViewModel.errorCode !== "PERSISTED_SIMULATION_RUN_INVALID") {
  throw new Error("structured persisted validation error should be preserved");
}

if (!simulationRunRetrievalLimitations.includes("Displays validated simulation run summaries only.")) {
  throw new Error("retrieval limitations should be explicit");
}

const text = JSON.stringify([successViewModel, emptyViewModel, errorViewModel]).toLowerCase();
for (const forbidden of [" safe ", " unsafe ", "recommended", " best "]) {
  if (text.includes(forbidden)) {
    throw new Error(`forbidden wording found: ${forbidden}`);
  }
}

const fetchCalls: string[] = [];
const successResponse = await listSimulationRuns("http://localhost:8010", 5, mockFetch(200, {
  simulationRuns: [
    {
      id: "simulation-run-proof",
      simulationRunId: "simulation-run-proof",
      scenarioId: "shift-scenario-basic",
      createdAt: "2026-05-23T00:00:00.000Z",
      updatedAt: "2026-05-23T00:00:00.000Z"
    }
  ],
  pagination: { limit: 5, offset: 0, returned: 1 }
}, fetchCalls));

if (successResponse.simulationRuns.length !== 1) {
  throw new Error("success fetch should return one simulation run");
}

if (!fetchCalls[0]?.endsWith("/v1/simulation/runs?limit=5&offset=0")) {
  throw new Error("simulation retrieval API should call bounded list endpoint");
}

const emptyResponse = await listSimulationRuns("http://localhost:8010", 5, mockFetch(200, {
  simulationRuns: [],
  pagination: { limit: 5, offset: 0, returned: 0 }
}, []));

if (emptyResponse.simulationRuns.length !== 0) {
  throw new Error("empty fetch should return no simulation runs");
}

try {
  await listSimulationRuns("http://localhost:8010", 5, mockFetch(500, {
    detail: {
      code: "PERSISTED_SIMULATION_RUN_INVALID",
      message: "persisted simulation run failed validation"
    }
  }, []));
  throw new Error("structured persisted validation error should throw");
} catch (error) {
  if (!(error instanceof SimulationRunRetrievalApiError)) {
    throw error;
  }
  if (error.code !== "PERSISTED_SIMULATION_RUN_INVALID") {
    throw new Error("structured persisted validation error code should be preserved");
  }
}

function mockFetch(status: number, body: unknown, calls: string[]): typeof fetch {
  return ((input: RequestInfo | URL) => {
    calls.push(String(input));
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body)
    } as Response);
  }) as typeof fetch;
}
