import { createSimulationTimelineViewModel } from "./simulationTimelineViewModel";

const viewModel = createSimulationTimelineViewModel();

if (!viewModel.summaryMetrics.some((metric) => metric.label === "Delayed")) {
  throw new Error("summary counts missing delayed metric");
}

if (!viewModel.summaryMetrics.some((metric) => metric.label === "Missed")) {
  throw new Error("summary counts missing missed metric");
}

if (!viewModel.summaryMetrics.some((metric) => metric.label === "Unassigned" && metric.value === 1)) {
  throw new Error("summary counts missing unassigned metric");
}

if (viewModel.timelineEvents.length === 0) {
  throw new Error("timeline events missing");
}

if (!viewModel.timelineEvents.some((event) => event.label.includes("travel"))) {
  throw new Error("timeline travel event missing");
}

if (!viewModel.nurseBurdenRows.some((row) => row.nurseId === "nurse-alpha")) {
  throw new Error("nurse burden rows missing");
}

if (viewModel.limitationRows.length === 0) {
  throw new Error("limitations missing");
}

const text = JSON.stringify(viewModel).toLowerCase();
for (const forbidden of [" safe ", " unsafe ", "recommended", " best "]) {
  if (text.includes(forbidden)) {
    throw new Error(`forbidden wording found: ${forbidden}`);
  }
}
