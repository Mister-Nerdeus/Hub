import type { SimulationV0ArtifactExportViewModel } from "./simulationV0ArtifactExportViewModel";

type Props = {
  viewModel: SimulationV0ArtifactExportViewModel;
};

export function SimulationV0ArtifactExport({ viewModel }: Props) {
  function downloadJson() {
    const blob = new Blob([viewModel.jsonText], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = viewModel.fileName;
    link.click();
    URL.revokeObjectURL(href);
  }

  async function copySummary() {
    await navigator.clipboard?.writeText(viewModel.summaryText);
  }

  return (
    <section className="simulation-v0-section" aria-labelledby="simulation-v0-export-title">
      <div className="simulation-v0-section__header">
        <div>
          <h3 id="simulation-v0-export-title">Artifact export</h3>
          <p>{viewModel.fileName}</p>
        </div>
        <div className="simulation-v0-actions">
          <button type="button" onClick={downloadJson}>Download JSON</button>
          <button type="button" onClick={() => void copySummary()}>Copy summary</button>
        </div>
      </div>
      <pre className="simulation-v0-export-preview">{viewModel.summaryText}</pre>
    </section>
  );
}
