import { useState } from "react";
import type { SimulationV0ArtifactExportViewModel } from "./simulationV0ArtifactExportViewModel";
import {
  simulationV0ArtifactExportStatusCopy,
  type SimulationV0ArtifactExportStatus
} from "./simulationV0ArtifactExportState";
import { simulationV0Copy } from "./simulationV0Copy";

type Props = {
  viewModel: SimulationV0ArtifactExportViewModel;
};

export function SimulationV0ArtifactExport({ viewModel }: Props) {
  const [status, setStatus] = useState<SimulationV0ArtifactExportStatus>("idle");

  function downloadJson() {
    const blob = new Blob([viewModel.jsonText], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = viewModel.fileName;
    link.click();
    URL.revokeObjectURL(href);
    setStatus("download_ready");
  }

  async function copySummary() {
    try {
      if (navigator.clipboard?.writeText == null) {
        setStatus("copy_failed");
        return;
      }
      await navigator.clipboard.writeText(viewModel.summaryText);
      setStatus("copy_succeeded");
    } catch {
      setStatus("copy_failed");
    }
  }

  return (
    <section className="simulation-v0-section" aria-labelledby="simulation-v0-export-title">
      <div className="simulation-v0-section__header">
        <div>
          <h3 id="simulation-v0-export-title">Artifact export</h3>
          <p>{viewModel.fileName}</p>
          <p>{simulationV0Copy.exportExplanation}</p>
        </div>
        <div className="simulation-v0-actions">
          <button type="button" onClick={downloadJson}>Download JSON</button>
          <button type="button" onClick={() => void copySummary()}>Copy summary</button>
        </div>
      </div>
      <p className="simulation-v0-export-status" role="status">{simulationV0ArtifactExportStatusCopy[status]}</p>
      <pre className="simulation-v0-export-preview" aria-label="Bounded synthetic review bundle preview">{viewModel.previewText}</pre>
    </section>
  );
}
