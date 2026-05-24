import type { FloorplanLibraryViewModel } from "./floorplanLibraryViewModel";

type FloorplanLibraryProps = {
  viewModel: FloorplanLibraryViewModel;
};

export function FloorplanLibrary({ viewModel }: FloorplanLibraryProps) {
  return (
    <section className="floorplan-library" aria-labelledby="floorplan-library-title">
      <div className="floorplan-library__header">
        <div>
          <p className="eyebrow">Floorplans</p>
          <h2 id="floorplan-library-title">JSON Floorplan Library</h2>
        </div>
        <dl className="floorplan-library__totals" aria-label="Floorplan library totals">
          <div>
            <dt>Defaults</dt>
            <dd>{viewModel.totals.defaultJsonPlanCount}</dd>
          </div>
          <div>
            <dt>Saved</dt>
            <dd>{viewModel.totals.editableSavedPlanCount}</dd>
          </div>
        </dl>
      </div>

      <div className="floorplan-library__grid">
        {viewModel.floorplans.map((floorplan) => (
          <article className="floorplan-library__card" key={floorplan.planId}>
            <div className="floorplan-library__card-header">
              <div>
                <h3>{floorplan.name}</h3>
                <p>{floorplan.planId}</p>
              </div>
              <span>{floorplan.readOnlyLabel}</span>
            </div>
            <dl className="floorplan-library__status">
              <div>
                <dt>Artifact</dt>
                <dd>{floorplan.artifactType}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>{floorplan.sourceDerivedStatus}</dd>
              </div>
              <div>
                <dt>Import</dt>
                <dd>{floorplan.importStatus}</dd>
              </div>
              <div>
                <dt>Mapping</dt>
                <dd>{floorplan.mappingStatus}</dd>
              </div>
            </dl>
            <dl className="floorplan-library__counts" aria-label={`${floorplan.name} object counts`}>
              <div>
                <dt>Rooms</dt>
                <dd>{floorplan.objectCounts.rooms}</dd>
              </div>
              <div>
                <dt>Halls</dt>
                <dd>{floorplan.objectCounts.hallways}</dd>
              </div>
              <div>
                <dt>Doors</dt>
                <dd>{floorplan.objectCounts.doors}</dd>
              </div>
              <div>
                <dt>Stations</dt>
                <dd>{floorplan.objectCounts.nurseStations}</dd>
              </div>
              <div>
                <dt>Zones</dt>
                <dd>{floorplan.objectCounts.zones}</dd>
              </div>
              <div>
                <dt>Nodes</dt>
                <dd>{floorplan.objectCounts.pathNodes}</dd>
              </div>
              <div>
                <dt>Edges</dt>
                <dd>{floorplan.objectCounts.pathEdges}</dd>
              </div>
            </dl>
            <ul className="floorplan-library__limitations">
              {floorplan.limitationsSummary.map((limitation) => (
                <li key={limitation}>{limitation}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <ul className="floorplan-library__limitations floorplan-library__limitations--global">
        {viewModel.limitationsSummary.map((limitation) => (
          <li key={limitation}>{limitation}</li>
        ))}
      </ul>
    </section>
  );
}
