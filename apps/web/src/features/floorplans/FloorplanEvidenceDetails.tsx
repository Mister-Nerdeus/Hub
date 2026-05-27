import type { FloorplanLibraryCardViewModel } from "./floorplanLibraryViewModel";

type FloorplanEvidenceDetailsProps = {
  floorplan: FloorplanLibraryCardViewModel;
};

export function FloorplanEvidenceDetails({ floorplan }: FloorplanEvidenceDetailsProps) {
  return (
    <details className="floorplan-library__evidence-details">
      <summary>Evidence details</summary>
      <dl>
        <div>
          <dt>Artifact type</dt>
          <dd>{floorplan.artifactType}</dd>
        </div>
        <div>
          <dt>Raw mapping</dt>
          <dd>{floorplan.mappingStatus ?? floorplan.parentDefaultPlanId}</dd>
        </div>
        <div>
          <dt>Path nodes</dt>
          <dd>{floorplan.objectCounts.pathNodes}</dd>
        </div>
        <div>
          <dt>Path edges</dt>
          <dd>{floorplan.objectCounts.pathEdges}</dd>
        </div>
      </dl>
    </details>
  );
}
