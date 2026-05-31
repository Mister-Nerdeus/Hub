export function routeStatusLabel(status: "ready" | "blocked" | "not_applicable"): string {
  if (status === "ready") return "Route ready";
  if (status === "blocked") return "Route blocked";
  return "Not applicable";
}

export function simulationExportStatusLabel(
  status: "simulation_ready" | "blocked" | "not_applicable"
): string {
  if (status === "simulation_ready") return "Route-ready export";
  if (status === "blocked") return "Route export blocked";
  return "Not applicable";
}

export function manualReviewStatusLabel(status: "manual_review_required" | "not_applicable"): string {
  if (status === "manual_review_required") return "Manual review required";
  return "Not applicable";
}

export function promotionStatusLabel(status: "blocked" | "not_applicable"): string {
  if (status === "blocked") return "Promotion blocked";
  return "Not applicable";
}
