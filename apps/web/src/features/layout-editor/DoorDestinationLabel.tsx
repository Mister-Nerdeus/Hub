import type { DoorDestinationViewModel } from "./doorDestinationViewModel";

type DoorDestinationLabelProps = {
  viewModel: DoorDestinationViewModel;
  visible: boolean;
};

export function DoorDestinationLabel({ viewModel, visible }: DoorDestinationLabelProps) {
  if (!visible) {
    return null;
  }
  return (
    <g
      className={`layout-editor-stage__door-destination-label${
        viewModel.isUnknown ? " layout-editor-stage__door-destination-label--warning" : ""
      }`}
      data-door-destination-label="true"
      data-door-id={viewModel.doorId}
      data-door-destination-kind={viewModel.leadsToKind}
      data-door-destination-warning={viewModel.isUnknown ? "true" : "false"}
      data-travel-role={viewModel.travelRole}
      role="note"
      aria-label={`Leads to ${viewModel.label}`}
    >
      <text x={viewModel.xPixels} y={viewModel.yPixels} textAnchor="middle">
        {viewModel.isUnknown ? `Unknown: ${viewModel.label}` : `Leads to ${viewModel.label}`}
      </text>
    </g>
  );
}
