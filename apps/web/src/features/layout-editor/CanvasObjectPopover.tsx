import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { CanvasObjectPopoverViewModel } from "./canvasObjectPopoverViewModel";

export type CanvasObjectPopoverProps = {
  viewModel: CanvasObjectPopoverViewModel;
  onClose: () => void;
  children?: ReactNode;
};

export function CanvasObjectPopover({ viewModel, onClose, children }: CanvasObjectPopoverProps) {
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    popoverRef.current?.focus();
  }, [viewModel.objectType, viewModel.objectId]);

  return (
    <foreignObject
      x={viewModel.xPixels}
      y={viewModel.yPixels}
      width={viewModel.widthPixels}
      height={viewModel.heightPixels}
      className="canvas-object-popover-shell"
      data-popover-anchor-type={viewModel.objectType}
      data-popover-anchor-id={viewModel.objectId}
    >
      <div
        ref={popoverRef}
        className="canvas-object-popover"
        role="dialog"
        aria-label={`${viewModel.title} quick actions`}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            onClose();
          }
        }}
      >
        <header>
          <strong>{viewModel.title}</strong>
          <button type="button" aria-label="Close object popover" onClick={onClose}>
            Close
          </button>
        </header>
        {children ?? <p>Selected object.</p>}
      </div>
    </foreignObject>
  );
}
