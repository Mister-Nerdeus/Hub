import { createReportProofViewModel } from "./reportProofViewModel";

const viewModel = createReportProofViewModel();

if (!viewModel.label.toLowerCase().includes("operational-only")) {
  throw new Error("report proof must label reports operational-only");
}

if (!viewModel.reports.some((report) => report.reportType === "operational_summary")) {
  throw new Error("summary section missing");
}

if (!viewModel.reports.some((report) => report.reportType === "nurse_workload")) {
  throw new Error("nurse workload section missing");
}

if (!viewModel.reports.some((report) => report.reportType === "unassigned_tasks")) {
  throw new Error("unassigned task section missing");
}

if (!viewModel.reports.some((report) => report.reportType === "warnings")) {
  throw new Error("warning section missing");
}

if (viewModel.summaryMetrics.length === 0) {
  throw new Error("summary section metrics missing");
}

if (viewModel.nurseRows.length === 0) {
  throw new Error("nurse workload rows missing");
}

if (!viewModel.unassignedRows.some((row) => row.taskId === "task-basic-hall-bed-01-turnover-001")) {
  throw new Error("unassigned task report must include task IDs");
}

if (!viewModel.unassignedRows.some((row) => row.roomId === "hall-bed-01")) {
  throw new Error("unassigned task report must include room IDs");
}

if (!viewModel.warningRows.some((row) => row.code === "ROOM_WITHOUT_COVERAGE")) {
  throw new Error("warning report must include warning code aggregation");
}

if (viewModel.limitations.length === 0) {
  throw new Error("limitations missing");
}

if (!viewModel.limitations.join(" ").includes("No optimizer")) {
  throw new Error("limitations must include no optimizer language");
}
