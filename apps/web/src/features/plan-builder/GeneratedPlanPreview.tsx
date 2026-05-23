import type { GeneratedPlanPreviewViewModel } from "./generatedPlanPreviewViewModel";
import "./GeneratedPlanPreview.css";

type Props = {
  preview: GeneratedPlanPreviewViewModel | null;
  onGenerate: () => void;
  onApply: () => void;
};

export function GeneratedPlanPreview({ preview, onGenerate, onApply }: Props) {
  return (
    <section className="generated-plan-preview" aria-label="Generated plan preview">
      <div className="generated-plan-preview__header">
        <div>
          <p className="eyebrow">Generated Plan Preview</p>
          <h2>Preview and apply generated draft</h2>
        </div>
        <div className="generated-plan-preview__actions">
          <button type="button" onClick={onGenerate}>
            Generate preview
          </button>
          <button type="button" onClick={onApply} disabled={!preview?.ok}>
            Apply to draft
          </button>
        </div>
      </div>

      {preview == null ? (
        <p className="generated-plan-preview__status">Preview has not been generated.</p>
      ) : preview.ok ? (
        <dl className="generated-plan-preview__summary">
          <Count label="Rooms" value={preview.summary.roomCount} />
          <Count label="Hallways" value={preview.summary.hallwayCount} />
          <Count label="Doors" value={preview.summary.doorCount} />
          <Count label="Stations" value={preview.summary.nurseStationCount} />
          <Count label="Zones" value={preview.summary.zoneCount} />
          <Count label="Path nodes" value={preview.summary.pathNodeCount} />
          <Count label="Path edges" value={preview.summary.pathEdgeCount} />
        </dl>
      ) : (
        <p className="generated-plan-preview__error">{preview.error}</p>
      )}
    </section>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
