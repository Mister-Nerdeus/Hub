import { syntheticManualAssignmentRoomLoads } from "@nerdeus/shared";
import { createRoomLoadEditorViewModel } from "../roomLoadEditorViewModel";

const viewModel = createRoomLoadEditorViewModel(syntheticManualAssignmentRoomLoads);

if (viewModel.cards.length !== 3) {
  throw new Error("room load editor view model must include synthetic room load defaults");
}

if (!viewModel.cards.some((card) => card.roomId === "room-102" && card.riskLabels.includes("Trauma"))) {
  throw new Error("room load editor must expose structured trauma state");
}

if (!viewModel.cards.every((card) => typeof card.frequencySummary === "string" && card.frequencySummary.includes("monitor"))) {
  throw new Error("room load editor must expose structured frequency summary");
}
