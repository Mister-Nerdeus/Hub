import type { SplitBayShapeViewModel } from "./splitBayShapeViewModel";
import { selectedClassName } from "./layoutSelectionHighlight";

type SplitBayShapeProps = {
  viewModel: SplitBayShapeViewModel;
  isSelected?: boolean;
  onSelect?: (objectType: "split_bay", objectId: string) => void;
};

export function SplitBayShape({ viewModel, isSelected = false, onSelect }: SplitBayShapeProps) {
  const divider = dividerLine(viewModel);
  return (
    <g
      className={selectedClassName("layout-editor-stage__split-bay", isSelected)}
      data-hit-target-key={viewModel.hitTargetKey}
      data-layout-object-type="split_bay"
      data-layout-object-id={viewModel.objectId}
      data-split-bay-divider-style={viewModel.dividerStyle}
      role="img"
      aria-label={viewModel.ariaLabel}
      tabIndex={0}
      onClick={() => onSelect?.("split_bay", viewModel.objectId)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.("split_bay", viewModel.objectId);
        }
      }}
    >
      <rect
        x={viewModel.xPixels}
        y={viewModel.yPixels}
        width={viewModel.widthPixels}
        height={viewModel.heightPixels}
        rx="0"
      />
      <line
        x1={divider.x1}
        y1={divider.y1}
        x2={divider.x2}
        y2={divider.y2}
      />
      <text
        x={viewModel.xPixels + viewModel.widthPixels * 0.28}
        y={viewModel.yPixels + viewModel.heightPixels * 0.5}
      >
        {viewModel.bedLabels[0]}
      </text>
      <text
        x={viewModel.xPixels + viewModel.widthPixels * 0.72}
        y={viewModel.yPixels + viewModel.heightPixels * 0.5}
      >
        {viewModel.bedLabels[1]}
      </text>
    </g>
  );
}

function dividerLine(viewModel: SplitBayShapeViewModel) {
  const { xPixels, yPixels, widthPixels, heightPixels } = viewModel;
  if (viewModel.dividerStyle === "vertical") {
    const x = xPixels + widthPixels / 2;
    return { x1: x, y1: yPixels, x2: x, y2: yPixels + heightPixels };
  }
  if (viewModel.dividerStyle === "horizontal") {
    const y = yPixels + heightPixels / 2;
    return { x1: xPixels, y1: y, x2: xPixels + widthPixels, y2: y };
  }
  return {
    x1: xPixels,
    y1: yPixels + heightPixels,
    x2: xPixels + widthPixels,
    y2: yPixels
  };
}
