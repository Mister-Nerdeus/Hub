import { useMemo, useState } from "react";

import {
  createRoutePreviewProofViewModel,
  type RoutePreviewProofViewModel
} from "./routePreviewProofViewModel";

type RoutePreviewProofProps = {
  initialViewModel: RoutePreviewProofViewModel;
};

export function RoutePreviewProof({ initialViewModel }: RoutePreviewProofProps) {
  const [selectedPlanId, setSelectedPlanId] = useState(initialViewModel.selectedPlanId);
  const [originPathNodeId, setOriginPathNodeId] = useState(initialViewModel.originPathNodeId);
  const [destinationPathNodeId, setDestinationPathNodeId] = useState(
    initialViewModel.destinationPathNodeId
  );
  const viewModel = useMemo(
    () =>
      createRoutePreviewProofViewModel({
        selectedPlanId,
        originPathNodeId,
        destinationPathNodeId
      }),
    [selectedPlanId, originPathNodeId, destinationPathNodeId]
  );
  const selectedPlan = viewModel.planOptions.find((plan) => plan.planId === viewModel.selectedPlanId);
  const nodeOptions = selectedPlan?.nodeOptions ?? [];

  function updatePlan(planId: string) {
    const nextViewModel = createRoutePreviewProofViewModel({ selectedPlanId: planId });
    setSelectedPlanId(nextViewModel.selectedPlanId);
    setOriginPathNodeId(nextViewModel.originPathNodeId);
    setDestinationPathNodeId(nextViewModel.destinationPathNodeId);
  }

  return (
    <section className="simulation-proof" id="route-preview-proof" aria-labelledby="route-preview-title">
      <div className="simulation-proof__header">
        <div>
          <p className="eyebrow">Path graph proof</p>
          <h2 id="route-preview-title">Route Preview</h2>
        </div>
        <div className="simulation-proof__sources">
          <span>
            <strong>Status</strong> {viewModel.routePreview.status}
          </span>
          <span>
            <strong>Plan</strong> {viewModel.selectedPlanId}
          </span>
        </div>
      </div>

      <div className="simulation-proof__panel">
        <div className="simulation-proof__grid">
          <div>
            <h3>Selection</h3>
            <label>
              Plan
              <select value={viewModel.selectedPlanId} onChange={(event) => updatePlan(event.target.value)}>
                {viewModel.planOptions.map((plan) => (
                  <option key={plan.planId} value={plan.planId}>
                    {plan.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Origin
              <select
                value={viewModel.originPathNodeId}
                onChange={(event) => setOriginPathNodeId(event.target.value)}
              >
                {nodeOptions.map((node) => (
                  <option key={node.pathNodeId} value={node.pathNodeId}>
                    {node.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Destination
              <select
                value={viewModel.destinationPathNodeId}
                onChange={(event) => setDestinationPathNodeId(event.target.value)}
              >
                {nodeOptions.map((node) => (
                  <option key={node.pathNodeId} value={node.pathNodeId}>
                    {node.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <h3>Output</h3>
            <dl className="simulation-proof__metrics">
              <div>
                <dt>Distance</dt>
                <dd>{viewModel.routePreview.totalDistanceFeet}</dd>
              </div>
              <div>
                <dt>Seconds</dt>
                <dd>{viewModel.routePreview.totalTravelSeconds}</dd>
              </div>
              <div>
                <dt>Nodes</dt>
                <dd>{viewModel.routePreview.routeNodeIds.length}</dd>
              </div>
              <div>
                <dt>Edges</dt>
                <dd>{viewModel.routePreview.routeEdgeIds.length}</dd>
              </div>
              <div>
                <dt>Warnings</dt>
                <dd>{viewModel.routePreview.warnings.length}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{viewModel.routePreview.status}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="simulation-proof__panel">
        <h3>Route Nodes</h3>
        <ol className="simulation-proof__timeline">
          {viewModel.routePreview.routeNodeIds.map((nodeId) => (
            <li key={nodeId}>{nodeId}</li>
          ))}
        </ol>
      </div>

      <div className="simulation-proof__panel">
        <h3>Route Edges</h3>
        <ol className="simulation-proof__timeline">
          {viewModel.routePreview.routeEdgeIds.map((edgeId) => (
            <li key={edgeId}>{edgeId}</li>
          ))}
        </ol>
      </div>

      <div className="simulation-proof__panel">
        <h3>Warnings</h3>
        <ol className="simulation-proof__limitations">
          {viewModel.routePreview.warnings.map((warning) => (
            <li key={warning.code}>{warning.code}</li>
          ))}
        </ol>
      </div>

      <div className="simulation-proof__panel">
        <h3>Limitations</h3>
        <ul className="simulation-proof__limitations">
          {viewModel.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
