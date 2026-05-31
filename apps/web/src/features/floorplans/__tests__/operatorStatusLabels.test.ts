import {
  manualReviewStatusLabel,
  promotionStatusLabel,
  routeStatusLabel,
  simulationExportStatusLabel
} from "../statusLabels";

if (routeStatusLabel("ready") !== "Route ready") throw new Error("route status label failed");
if (simulationExportStatusLabel("simulation_ready") !== "Route-ready export") throw new Error("export label failed");
if (manualReviewStatusLabel("manual_review_required") !== "Manual review required") throw new Error("review label failed");
if (promotionStatusLabel("blocked") !== "Promotion blocked") throw new Error("promotion label failed");
