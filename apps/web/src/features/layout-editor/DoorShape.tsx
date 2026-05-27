import type { DoorShapeViewModel } from "./doorShapeViewModel";
import { selectedClassName } from "./layoutSelectionHighlight";
import { DoorAccessMarker } from "./DoorAccessMarker";

type DoorShapeProps = {
  viewModel: DoorShapeViewModel;
  isSelected?: boolean;
  onSelect?: (objectType: "door", objectId: string) => void;
};

export function DoorShape({ viewModel, isSelected = false, onSelect }: DoorShapeProps) {
  return (
    <g
      className={selectedClassName("layout-editor-stage__door layout-editor-stage__door-marker", isSelected)}
      data-hit-target-key={viewModel.hitTargetKey}
      data-door-wall={viewModel.wall}
      data-door-orientation={viewModel.orientation}
      data-door-invalid={viewModel.invalid ? "true" : "false"}
      role="img"
      aria-label={viewModel.ariaLabel}
      onClick={() => onSelect?.("door", viewModel.objectId)}
    >
      <DoorAccessMarker viewModel={viewModel} />
    </g>
  );
}
