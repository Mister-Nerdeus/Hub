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

  const closeAndReturnFocus = () => {
    onClose();
    if (typeof window === "undefined") {
      return;
    }
    window.setTimeout(() => focusPopoverAnchor(viewModel), 0);
  };

  return (
    <foreignObject
      x={viewModel.xPixels}
      y={viewModel.yPixels}
      width={viewModel.widthPixels}
      height={viewModel.heightPixels}
      className="canvas-object-popover-shell"
      data-popover-anchor-type={viewModel.objectType}
      data-popover-anchor-id={viewModel.objectId}
      data-popover-placement={viewModel.placement}
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
            closeAndReturnFocus();
          }
        }}
      >
        <header>
          <strong>{viewModel.title}</strong>
          <button type="button" aria-label="Close object popover" onClick={closeAndReturnFocus}>
            Close
          </button>
        </header>
        {children ?? <p>Selected object.</p>}
      </div>
    </foreignObject>
  );
}

function focusPopoverAnchor(viewModel: CanvasObjectPopoverViewModel): void {
  const selector = [
    `[data-layout-object-type="${escapeSelectorValue(viewModel.objectType)}"]`,
    `[data-layout-object-id="${escapeSelectorValue(viewModel.objectId)}"]`
  ].join("");
  const anchor = document.querySelector(selector);
  if (anchor instanceof HTMLElement || anchor instanceof SVGElement) {
    anchor.focus();
  }
}

function escapeSelectorValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
