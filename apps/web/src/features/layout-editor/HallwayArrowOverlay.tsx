import type { HallwayArrowViewModel } from "./hallwayArrowViewModel";

type HallwayArrowOverlayProps = {
  arrows: HallwayArrowViewModel[];
};

export function HallwayArrowOverlay({ arrows }: HallwayArrowOverlayProps) {
  return (
    <g className="layout-editor-stage__hallway-arrow-overlay" aria-label="Presentation hallway arrows">
      <defs>
        <marker id="layout-editor-stage-arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" />
        </marker>
      </defs>
      {arrows.filter((arrow) => arrow.visible).map((arrow) => (
        <line
          key={arrow.id}
          className="layout-editor-stage__hallway-arrow"
          x1={arrow.x1}
          y1={arrow.y1}
          x2={arrow.x2}
          y2={arrow.y2}
          markerEnd="url(#layout-editor-stage-arrowhead)"
          data-hallway-id={arrow.hallwayId}
          data-arrow-reversed={arrow.reversed}
        />
      ))}
    </g>
  );
}
