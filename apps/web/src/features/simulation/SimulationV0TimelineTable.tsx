import { useMemo, useState } from "react";
import type { SimulationV0TimelineViewModel } from "./simulationV0TimelineViewModel";
import { simulationV0Copy } from "./simulationV0Copy";
import {
  filterSimulationV0TimelineRows,
  getSimulationV0TimelinePageCount,
  paginateSimulationV0TimelineRows,
  simulationV0DefaultTimelineTableState,
  simulationV0TimelineFilterOptions,
  type SimulationV0TimelineFilter
} from "./simulationV0TimelineState";

type Props = {
  viewModel: SimulationV0TimelineViewModel;
};

export function SimulationV0TimelineTable({ viewModel }: Props) {
  const [tableState, setTableState] = useState(simulationV0DefaultTimelineTableState);
  const filteredRows = useMemo(
    () => filterSimulationV0TimelineRows(
      viewModel.rows,
      tableState.filter,
      tableState.syntheticNurseId,
      tableState.bedPositionId
    ),
    [viewModel.rows, tableState.filter, tableState.syntheticNurseId, tableState.bedPositionId]
  );
  const pageCount = getSimulationV0TimelinePageCount(filteredRows.length, tableState.rowDisplay);
  const pageIndex = Math.min(tableState.pageIndex, pageCount - 1);
  const visibleRows = paginateSimulationV0TimelineRows(filteredRows, pageIndex, tableState.rowDisplay);
  function selectFilter(filter: SimulationV0TimelineFilter) {
    setTableState((state) => ({ ...state, filter, pageIndex: 0 }));
  }
  function movePage(delta: number) {
    setTableState((state) => ({
      ...state,
      pageIndex: Math.min(Math.max(state.pageIndex + delta, 0), pageCount - 1)
    }));
  }
  function updateBoundedControl(nextState: Partial<typeof tableState>) {
    setTableState((state) => ({ ...state, ...nextState, pageIndex: 0 }));
  }
  function resetFilters() {
    setTableState(simulationV0DefaultTimelineTableState);
  }

  return (
    <section className="simulation-v0-section" aria-labelledby="simulation-v0-timeline-title">
      <div className="simulation-v0-section__header">
        <div>
          <h3 id="simulation-v0-timeline-title">Dry-run timeline</h3>
          <p>{viewModel.profileId} / {viewModel.ratioView}</p>
          <p>{simulationV0Copy.timelineExplanation}</p>
        </div>
        <strong>{visibleRows.length} of {filteredRows.length}</strong>
      </div>
      <div className="simulation-v0-timeline-toolbar" aria-label="Timeline controls">
        <div className="simulation-v0-filter-buttons" role="group" aria-label="Fixed event filters">
          {simulationV0TimelineFilterOptions.map((option) => (
            <button
              aria-pressed={tableState.filter === option.id}
              key={option.id}
              onClick={() => selectFilter(option.id)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        <label className="simulation-v0-select-control">
          Rows
          <select
            value={tableState.rowDisplay}
            onChange={(event) => updateBoundedControl({ rowDisplay: event.target.value as typeof tableState.rowDisplay })}
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="all">All bounded</option>
          </select>
        </label>
        <label className="simulation-v0-select-control">
          Synthetic nurse
          <select
            value={tableState.syntheticNurseId}
            onChange={(event) => updateBoundedControl({ syntheticNurseId: event.target.value })}
          >
            <option value="all_synthetic_nurses">All synthetic nurses</option>
            {viewModel.availableSyntheticNurseIds.map((syntheticNurseId) => (
              <option key={syntheticNurseId} value={syntheticNurseId}>{syntheticNurseId}</option>
            ))}
          </select>
        </label>
        <label className="simulation-v0-select-control">
          Bed position
          <select
            value={tableState.bedPositionId}
            onChange={(event) => updateBoundedControl({ bedPositionId: event.target.value })}
          >
            <option value="all_bed_positions">All bed positions</option>
            {viewModel.availableBedPositionIds.map((bedPositionId) => (
              <option key={bedPositionId} value={bedPositionId}>{bedPositionId}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={resetFilters}>Reset filters</button>
        <div className="simulation-v0-pagination" role="group" aria-label="Timeline pagination">
          <button type="button" onClick={() => movePage(-1)} disabled={pageIndex === 0}>
            Previous page
          </button>
          <span>Page {pageIndex + 1} of {pageCount}</span>
          <button type="button" onClick={() => movePage(1)} disabled={pageIndex >= pageCount - 1}>
            Next page
          </button>
        </div>
      </div>
      <p className="simulation-v0-row-summary">
        Showing {visibleRows.length} rows from {filteredRows.length} filtered events and {viewModel.totalRowCount} total events for {viewModel.profileId} / {viewModel.ratioView}.
      </p>
      <div className="simulation-v0-panel__table simulation-v0-panel__table--timeline" role="table" aria-label="Dry-run timeline events">
        <div role="row">
          <span role="columnheader">Event ID</span>
          <span role="columnheader">Minute</span>
          <span role="columnheader">Event</span>
          <span role="columnheader">Task</span>
          <span role="columnheader">Bed position</span>
          <span role="columnheader">Synthetic nurse</span>
        </div>
        {visibleRows.map((row) => (
          <div role="row" key={row.eventId}>
            <span role="cell">{row.eventId}</span>
            <span role="cell">{row.minute}</span>
            <span role="cell">{row.eventLabel}</span>
            <span role="cell">{row.taskInstanceId}</span>
            <span role="cell">{row.bedPositionId}</span>
            <span role="cell">{row.syntheticNurseId ?? "unassigned"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
