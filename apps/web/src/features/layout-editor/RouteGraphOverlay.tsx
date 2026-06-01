import { routeNodeIdFor, type RouteGraphContract } from "@nerdeus/shared";

import { rectFeetToPixels, type LayoutViewportTransform } from "./layoutCoordinateSystem";

type RouteGraphOverlayProps = {
  graph: RouteGraphContract | null;
  viewport: LayoutViewportTransform;
  visible: boolean;
};

export function RouteGraphOverlay({ graph, viewport, visible }: RouteGraphOverlayProps) {
  if (!visible || graph == null) {
    return null;
  }
  const nodesById = new Map(graph.nodes.map((node) => [node.routeNodeId, node]));
  return (
    <g
      className="route-graph-overlay"
      data-route-graph-overlay="visible"
      data-route-graph-scope={graph.routeGraphScope}
      data-route-node-count={graph.nodes.length}
      data-route-edge-count={graph.edges.length}
      aria-label="Route connectivity overlay"
    >
      <g className="route-graph-overlay__edges">
        {graph.edges.map((edge) => {
          const from = nodesById.get(edge.fromNodeId);
          const to = nodesById.get(edge.toNodeId);
          if (from == null || to == null) {
            return null;
          }
          const fromPixels = pointToPixels(from, viewport);
          const toPixels = pointToPixels(to, viewport);
          return (
            <line
              key={edge.routeEdgeId}
              data-route-edge="true"
              data-route-edge-id={edge.routeEdgeId}
              data-route-edge-traversable={edge.traversable ? "true" : "false"}
              data-route-edge-blocked-by-wall={edge.blockedByWall ? "true" : "false"}
              className={edge.traversable ? "route-graph-overlay__edge" : "route-graph-overlay__edge route-graph-overlay__edge--blocked"}
              x1={fromPixels.xPixels}
              y1={fromPixels.yPixels}
              x2={toPixels.xPixels}
              y2={toPixels.yPixels}
            />
          );
        })}
      </g>
      <g className="route-graph-overlay__nodes">
        {graph.nodes.map((node) => {
          const point = pointToPixels(node, viewport);
          return (
            <circle
              key={node.routeNodeId}
              data-route-node="true"
              data-route-node-id={node.routeNodeId}
              data-route-source-kind={node.sourceKind}
              data-route-source-id={node.sourceId}
              cx={point.xPixels}
              cy={point.yPixels}
              r={node.sourceKind === "door" || node.sourceKind === "support_access" ? 3.6 : 4.8}
            />
          );
        })}
      </g>
      <g className="route-graph-overlay__warnings">
        {graph.warnings.map((warning) => {
          const mappedKind = warning.sourceObjectType === "perimeter_wall"
            ? "room"
            : warning.sourceObjectType;
          const node = nodesById.get(routeNodeIdFor(mappedKind, warning.sourceObjectId));
          if (node == null) {
            return null;
          }
          const point = pointToPixels(node, viewport);
          return (
            <text
              key={`${warning.code}:${warning.sourceObjectType}:${warning.sourceObjectId}`}
              data-route-warning-marker="true"
              data-route-warning-code={warning.code}
              x={point.xPixels + 7}
              y={point.yPixels - 7}
            >
              !
            </text>
          );
        })}
      </g>
    </g>
  );
}

function pointToPixels(
  point: { xFeet: number; yFeet: number },
  viewport: LayoutViewportTransform
) {
  return rectFeetToPixels({
    xFeet: point.xFeet,
    yFeet: point.yFeet,
    widthFeet: 0,
    heightFeet: 0
  }, viewport);
}
