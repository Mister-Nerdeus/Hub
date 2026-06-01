import type { LayoutObjectRenderItem } from "./layoutObjectRenderPipeline";
import { selectedClassName } from "./layoutSelectionHighlight";

type EntryExitShapeProps = {
  item: LayoutObjectRenderItem;
  isSelected?: boolean;
  onSelect?: (objectType: "entry_exit", objectId: string) => void;
};

export function EntryExitShape({ item, isSelected = false, onSelect }: EntryExitShapeProps) {
  const entryExit = item.sourceGeometry as {
    label: string;
    kind: string;
    connectsTo: { displayLabel: string };
  };
  return (
    <g
      className={selectedClassName("layout-editor-stage__entry-exit", isSelected)}
      data-layout-object-type="entry_exit"
      data-layout-object-id={item.objectId}
      data-entry-exit-kind={entryExit.kind}
      data-entry-exit-destination-label={entryExit.connectsTo.displayLabel}
      data-blocks-travel="false"
      data-selectable="true"
      role="img"
      aria-label={`${entryExit.label} entry or exit to ${entryExit.connectsTo.displayLabel}`}
      tabIndex={0}
      onClick={() => onSelect?.("entry_exit", item.objectId)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.("entry_exit", item.objectId);
        }
      }}
    >
      <rect
        x={item.displayRectPixels.xPixels}
        y={item.displayRectPixels.yPixels}
        width={item.displayRectPixels.widthPixels}
        height={item.displayRectPixels.heightPixels}
        rx="2"
      />
      <text
        x={item.displayRectPixels.xPixels + item.displayRectPixels.widthPixels / 2}
        y={item.displayRectPixels.yPixels + item.displayRectPixels.heightPixels / 2 + 4}
        textAnchor="middle"
      >
        {entryExit.label}
      </text>
    </g>
  );
}
