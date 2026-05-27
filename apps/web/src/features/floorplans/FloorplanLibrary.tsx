import type { FloorplanLibraryViewModel } from "./floorplanLibraryViewModel";
import { DefaultPlanEditCopyControls } from "./DefaultPlanEditCopyControls";
import { DeleteSavedFloorplanDialog } from "./DeleteSavedFloorplanDialog";
import { createDeleteSavedFloorplanDialogViewModel } from "./deleteSavedFloorplanViewModel";
import { useState } from "react";

type FloorplanLibraryProps = {
  viewModel: FloorplanLibraryViewModel;
  onOpenDefaultPlan?: (planId: string) => void;
  onDuplicateDefaultPlan?: (planId: string) => void;
  onOpenSavedPlan?: (recordId: string) => void;
  onDeleteSavedPlan?: (recordId: string) => void;
};

export function FloorplanLibrary({
  viewModel,
  onOpenDefaultPlan,
  onDuplicateDefaultPlan,
  onOpenSavedPlan,
  onDeleteSavedPlan
}: FloorplanLibraryProps) {
  const [pendingDeleteRecordId, setPendingDeleteRecordId] = useState<string | null>(null);
  const pendingDeleteFloorplan = pendingDeleteRecordId == null
    ? null
    : viewModel.floorplans.find((floorplan) => floorplan.recordId === pendingDeleteRecordId) ?? null;
  const pendingDeleteViewModel = pendingDeleteFloorplan == null
    ? null
    : createDeleteSavedFloorplanDialogViewModel(pendingDeleteFloorplan);

  return (
    <section className="floorplan-library" aria-labelledby="floorplan-library-title">
      <div className="floorplan-library__header">
        <div>
          <p className="eyebrow">Floorplans</p>
          <h2 id="floorplan-library-title">{viewModel.title}</h2>
        </div>
        <dl className="floorplan-library__totals" aria-label="Floorplan library totals">
          <div>
            <dt>Canonical</dt>
            <dd>{viewModel.totals.canonicalDefaultPlanCount}</dd>
          </div>
          <div>
            <dt>Saved</dt>
            <dd>{viewModel.totals.editableSavedPlanCount}</dd>
          </div>
          <div>
            <dt>Legacy refs</dt>
            <dd>{viewModel.totals.protectedLegacyDefaultPlanCount}</dd>
          </div>
        </dl>
      </div>

      <div className="floorplan-library__grid">
        {viewModel.floorplans.map((floorplan) => (
          <article
            className="floorplan-library__card"
            key={floorplan.recordId}
            data-plan-id={floorplan.planId}
            data-record-id={floorplan.recordId}
            data-default-classification={floorplan.defaultClassification ?? "saved-copy"}
            data-product-visibility={floorplan.productVisibility}
            data-room-count={floorplan.objectCounts.rooms}
            data-station-count={floorplan.objectCounts.nurseStations}
          >
            <div className="floorplan-library__card-header">
              <div>
                <h3>{floorplan.name}</h3>
                <p>{floorplan.planId}</p>
              </div>
              <span>{floorplan.readOnlyLabel}</span>
            </div>
            <div className="floorplan-library__actions">
              {floorplan.accessMode === "read-only-default" && onOpenDefaultPlan ? (
                <button
                  className="floorplan-library__open"
                  type="button"
                  onClick={() => onOpenDefaultPlan(floorplan.planId)}
                >
                  Open JSON
                </button>
              ) : null}
              {floorplan.accessMode === "read-only-default" && onDuplicateDefaultPlan ? (
                <DefaultPlanEditCopyControls
                  planId={floorplan.planId}
                  readOnly={true}
                  onDuplicateForEditing={onDuplicateDefaultPlan}
                />
              ) : null}
              {floorplan.accessMode === "editable-saved" && onOpenSavedPlan ? (
                <button
                  className="floorplan-library__open"
                  type="button"
                  onClick={() => onOpenSavedPlan(floorplan.recordId)}
                >
                  Open Saved JSON
                </button>
              ) : null}
              {floorplan.accessMode === "editable-saved" && onDeleteSavedPlan ? (
                <button type="button" onClick={() => setPendingDeleteRecordId(floorplan.recordId)}>
                  Delete saved copy
                </button>
              ) : null}
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
                <dd>{floorplan.mappingStatus ?? floorplan.parentDefaultPlanId}</dd>
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
      {pendingDeleteViewModel == null || onDeleteSavedPlan == null ? null : (
        <DeleteSavedFloorplanDialog
          viewModel={pendingDeleteViewModel}
          onCancel={() => setPendingDeleteRecordId(null)}
          onConfirm={(recordId) => {
            onDeleteSavedPlan(recordId);
            setPendingDeleteRecordId(null);
          }}
        />
      )}
    </section>
  );
}
