import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";

export type EditorWorkspaceMeasurements = {
  shellRef: RefObject<HTMLDivElement | null>;
  sidePanelRef: RefObject<HTMLDivElement | null>;
  workspaceStyle: CSSProperties;
  canvasHeight: number;
};

const DESKTOP_MIN_CANVAS_HEIGHT = 820;
const LAPTOP_MIN_CANVAS_HEIGHT = 720;
const MAX_CANVAS_HEIGHT = 1180;

export function useEditorWorkspaceMeasurements(inspectorCollapsed: boolean): EditorWorkspaceMeasurements {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const sidePanelRef = useRef<HTMLDivElement | null>(null);
  const [canvasHeight, setCanvasHeight] = useState(DESKTOP_MIN_CANVAS_HEIGHT);

  useEffect(() => {
    const measure = () => {
      const viewportHeight = typeof window === "undefined" ? DESKTOP_MIN_CANVAS_HEIGHT : window.innerHeight;
      const viewportWidth = typeof window === "undefined" ? 1440 : window.innerWidth;
      const minHeight = viewportWidth >= 1200 ? DESKTOP_MIN_CANVAS_HEIGHT : LAPTOP_MIN_CANVAS_HEIGHT;
      const inspectorHeight = inspectorCollapsed
        ? 0
        : Math.ceil(sidePanelRef.current?.getBoundingClientRect().height ?? 0);
      const availableHeight = Math.max(minHeight, viewportHeight - 180);
      const nextHeight = Math.min(
        MAX_CANVAS_HEIGHT,
        Math.max(minHeight, inspectorHeight, availableHeight)
      );
      setCanvasHeight(nextHeight);
    };

    measure();
    window.addEventListener("resize", measure);
    const observer = new ResizeObserver(measure);
    if (sidePanelRef.current != null) {
      observer.observe(sidePanelRef.current);
    }
    if (shellRef.current != null) {
      observer.observe(shellRef.current);
    }
    return () => {
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
  }, [inspectorCollapsed]);

  return {
    shellRef,
    sidePanelRef,
    canvasHeight,
    workspaceStyle: {
      "--editor-canvas-height": `${canvasHeight}px`,
      "--editor-canvas-min-height": `${canvasHeight >= DESKTOP_MIN_CANVAS_HEIGHT ? DESKTOP_MIN_CANVAS_HEIGHT : LAPTOP_MIN_CANVAS_HEIGHT}px`
    } as CSSProperties
  };
}
