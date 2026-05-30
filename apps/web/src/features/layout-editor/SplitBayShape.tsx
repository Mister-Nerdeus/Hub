import type { SplitBayShapeViewModel } from "./splitBayShapeViewModel";
import { selectedClassName } from "./layoutSelectionHighlight";
import type { LayoutAssignmentOverlayRoom } from "./layoutAssignmentOverlay";

type SplitBayShapeProps = {
  viewModel: SplitBayShapeViewModel;
  childAssignments?: readonly (LayoutAssignmentOverlayRoom | null)[];
  isSelected?: boolean;
  onSelect?: (objectType: "split_bay", objectId: string) => void;
};

export function SplitBayShape({
  viewModel,
  childAssignments = [],
  isSelected = false,
  onSelect
}: SplitBayShapeProps) {
  const divider = dividerLine(viewModel);
  const [firstAssignment, secondAssignment] = childAssignments;
  const childAssignmentColors = childAssignments
    .map((assignment) => assignment?.assignmentColor ?? "")
    .join("|");
  return (
    <g
      className={selectedClassName("layout-editor-stage__split-bay", isSelected)}
      data-hit-target-key={viewModel.hitTargetKey}
      data-layout-object-type="split_bay"
      data-layout-object-id={viewModel.objectId}
      data-split-bay-child-room-ids={viewModel.bedRoomIds.join("|")}
      data-split-bay-child-assignment-colors={childAssignmentColors}
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
      <g className="layout-editor-stage__split-bay-assignment" aria-hidden="true">
        {assignmentFill(viewModel, firstAssignment, "first")}
        {assignmentFill(viewModel, secondAssignment, "second")}
      </g>
      <line
        className="layout-editor-stage__split-bay-divider"
        x1={divider.x1}
        y1={divider.y1}
        x2={divider.x2}
        y2={divider.y2}
      />
      <text
        className="layout-editor-stage__split-bay-label"
        x={viewModel.xPixels + viewModel.widthPixels * 0.28}
        y={viewModel.yPixels + viewModel.heightPixels * 0.35}
      >
        {viewModel.bedLabels[0]}
      </text>
      <text
        className="layout-editor-stage__split-bay-label"
        x={viewModel.xPixels + viewModel.widthPixels * 0.72}
        y={viewModel.yPixels + viewModel.heightPixels * 0.65}
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
  if (viewModel.dividerStyle === "diagonal_up") {
    return {
      x1: xPixels,
      y1: yPixels,
      x2: xPixels + widthPixels,
      y2: yPixels + heightPixels
    };
  }
  return {
    x1: xPixels,
    y1: yPixels + heightPixels,
    x2: xPixels + widthPixels,
    y2: yPixels
  };
}

function assignmentFill(
  viewModel: SplitBayShapeViewModel,
  assignment: LayoutAssignmentOverlayRoom | null | undefined,
  position: "first" | "second"
) {
  if (assignment?.assignmentColor == null) {
    return null;
  }
  const { xPixels, yPixels, widthPixels, heightPixels } = viewModel;
  if (viewModel.dividerStyle === "vertical") {
    return (
      <rect
        x={position === "first" ? xPixels : xPixels + widthPixels / 2}
        y={yPixels}
        width={widthPixels / 2}
        height={heightPixels}
        style={{ fill: assignment.assignmentColor }}
      />
    );
  }
  if (viewModel.dividerStyle === "horizontal") {
    return (
      <rect
        x={xPixels}
        y={position === "first" ? yPixels : yPixels + heightPixels / 2}
        width={widthPixels}
        height={heightPixels / 2}
        style={{ fill: assignment.assignmentColor }}
      />
    );
  }
  const firstPoints = `${xPixels},${yPixels} ${xPixels + widthPixels},${yPixels} ${xPixels},${yPixels + heightPixels}`;
  const secondPoints = `${xPixels + widthPixels},${yPixels} ${xPixels + widthPixels},${yPixels + heightPixels} ${xPixels},${yPixels + heightPixels}`;
  const upFirstPoints = `${xPixels},${yPixels} ${xPixels + widthPixels},${yPixels + heightPixels} ${xPixels},${yPixels + heightPixels}`;
  const upSecondPoints = `${xPixels},${yPixels} ${xPixels + widthPixels},${yPixels} ${xPixels + widthPixels},${yPixels + heightPixels}`;
  return (
    <polygon
      points={
        viewModel.dividerStyle === "diagonal_up"
          ? position === "first" ? upFirstPoints : upSecondPoints
          : position === "first" ? firstPoints : secondPoints
      }
      style={{ fill: assignment.assignmentColor }}
    />
  );
}
