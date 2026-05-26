import type { ActiveFloorplanSummaryViewModel } from "./activeFloorplanState";
import { ActiveFloorplanSummary } from "./ActiveFloorplanSummary";

type ActiveFloorplanPanelProps = {
  viewModel: ActiveFloorplanSummaryViewModel;
};

export function ActiveFloorplanPanel({ viewModel }: ActiveFloorplanPanelProps) {
  return <ActiveFloorplanSummary viewModel={viewModel} />;
}
