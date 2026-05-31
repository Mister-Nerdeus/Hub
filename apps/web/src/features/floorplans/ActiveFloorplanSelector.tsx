import type { ActiveFloorplanSelectorViewModel } from "./activeFloorplanSelectorViewModel";
import { ActiveFloorplanCard } from "./ActiveFloorplanCard";

type ActiveFloorplanSelectorProps = {
  viewModel: ActiveFloorplanSelectorViewModel;
  onEditFloorplan: () => void;
  onUseForAssignment: () => void;
  onChangeFloorplan: (versionId: string) => void;
  onOpenAdvanced: () => void;
};

export function ActiveFloorplanSelector({
  viewModel,
  onEditFloorplan,
  onUseForAssignment,
  onChangeFloorplan,
  onOpenAdvanced
}: ActiveFloorplanSelectorProps) {
  return (
    <ActiveFloorplanCard
      viewModel={viewModel}
      onEditFloorplan={onEditFloorplan}
      onUseForAssignment={onUseForAssignment}
      onChangeFloorplan={onChangeFloorplan}
      onOpenAdvanced={onOpenAdvanced}
    />
  );
}
