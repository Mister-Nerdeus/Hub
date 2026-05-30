import { getRuntimeBuildInfo } from "./runtimeBuildInfo";

export function RuntimeBuildInfoPanel() {
  const build = getRuntimeBuildInfo();
  return (
    <aside
      className="runtime-build-info"
      aria-label="Runtime build info"
      data-runtime-build-info="true"
      data-build-commit={build.buildCommit}
      data-build-time={build.buildTime}
      data-runtime-mode={build.runtimeMode}
      data-editor-save-ux={build.editorSaveUx}
      data-batch-marker={build.batchMarker}
    >
      <dl>
        <div>
          <dt>Build commit</dt>
          <dd>{build.buildCommit}</dd>
        </div>
        <div>
          <dt>Build time</dt>
          <dd>{build.buildTime}</dd>
        </div>
        <div>
          <dt>Runtime mode</dt>
          <dd>{build.runtimeMode}</dd>
        </div>
        <div>
          <dt>Editor save UX</dt>
          <dd>enabled</dd>
        </div>
        <div>
          <dt>Batch marker</dt>
          <dd>{build.batchMarker}</dd>
        </div>
      </dl>
      <p>
        Local reset: stop the dev server, pull latest source, restart npm run dev,
        hard refresh, then verify this marker before testing saves.
      </p>
    </aside>
  );
}
