import type { ActiveFloorplanSelectorViewModel } from "./activeFloorplanSelectorViewModel";
import { ActiveFloorplanCard } from "./ActiveFloorplanCard";

type ActiveFloorplanSelectorProps = {
  viewModel: ActiveFloorplanSelectorViewModel;
  onEditFloorplan: () => void;
  onUseForAssignment: () => void;
  onUseForSimulation: () => void;
  onChangeFloorplan: (versionId: string) => void;
  onOpenAdvanced: () => void;
};

export function ActiveFloorplanSelector({
  viewModel,
  onEditFloorplan,
  onUseForAssignment,
  onUseForSimulation,
  onChangeFloorplan,
  onOpenAdvanced
}: ActiveFloorplanSelectorProps) {
  return (
    <ActiveFloorplanCard
      viewModel={viewModel}
      onEditFloorplan={onEditFloorplan}
      onUseForAssignment={onUseForAssignment}
      onUseForSimulation={onUseForSimulation}
      onChangeFloorplan={onChangeFloorplan}
      onOpenAdvanced={onOpenAdvanced}
    />
  );
}
