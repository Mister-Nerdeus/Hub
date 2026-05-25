import type { Plan1TimelineViewModel } from "@nerdeus/shared";

export function Plan1SimulationTimelinePanel({ viewModel }: { viewModel: Plan1TimelineViewModel }) {
  return (
    <section className="assignment-panel" aria-labelledby="plan-1-timeline-title" data-scenario-stage="timeline">
      <h3 id="plan-1-timeline-title">Simulation Timeline</h3>
      <dl className="scenario-metric-grid">
        <div><dt>Deferred tasks</dt><dd>{viewModel.deferredTaskSummary.totalDeferredTaskCount}</dd></div>
        <div><dt>Max queue depth</dt><dd>{viewModel.queueDepthSummary.maxQueueDepth}</dd></div>
        <div><dt>Walking ft</dt><dd>{viewModel.walkingLoadSummary.totalApproxWalkingFeet}</dd></div>
        <div><dt>Path-based tasks</dt><dd>{viewModel.walkingLoadSummary.pathBasedTaskCount}</dd></div>
        <div><dt>Fallback tasks</dt><dd>{viewModel.walkingLoadSummary.fallbackTaskCount}</dd></div>
        <div><dt>Warnings</dt><dd>{viewModel.warningTimelineSummary.length}</dd></div>
      </dl>
      <h4>Nurse timeline summary</h4>
      <table>
        <thead><tr><th>Nurse</th><th>Tasks</th><th>Deferred</th><th>Busy</th><th>Idle</th><th>Walking</th></tr></thead>
        <tbody>
          {viewModel.nurseTimelineSummary.map((row) => (
            <tr key={row.nurseId}>
              <td>{row.nurseId}</td>
              <td>{row.assignedTaskCount}</td>
              <td>{row.deferredTaskCount}</td>
              <td>{row.approxBusyMinutes}</td>
              <td>{row.approxIdleMinutes}</td>
              <td>{row.approxWalkingFeet}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h4>Room timeline summary</h4>
      <p>{viewModel.roomTimelineSummary.filter((row) => row.deferredTaskCount > 0).length} rooms have deferred synthetic tasks.</p>
      <h4>Warning timeline summary</h4>
      <p>{viewModel.warningTimelineSummary.map((row) => `${row.warningCode}: ${row.count}`).join(", ") || "none"}</p>
      <p>{viewModel.limitations.join(" ")}</p>
      <p>{viewModel.nonClaims.join(" ")}</p>
    </section>
  );
}
