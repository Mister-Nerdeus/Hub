import { useState } from "react";
import type { PlanContract } from "@nerdeus/shared";

import { parsePlanImport, serializePlanForExport } from "./planImportExport";
import "./PlanImportExportPanel.css";

type PlanImportExportPanelProps = {
  draftPlan: PlanContract;
  onImportPlan: (plan: PlanContract) => void;
};

export function PlanImportExportPanel({ draftPlan, onImportPlan }: PlanImportExportPanelProps) {
  const [jsonText, setJsonText] = useState("");
  const [status, setStatus] = useState("Ready");

  function exportPlan() {
    try {
      const exported = serializePlanForExport(draftPlan);
      setJsonText(exported);
      setStatus(`Exported ${draftPlan.planId}`);
    } catch (error) {
      setStatus(errorMessage(error));
    }
  }

  function importPlan() {
    try {
      const imported = parsePlanImport(jsonText);
      onImportPlan(imported);
      setStatus(`Imported ${imported.planId}`);
    } catch (error) {
      setStatus(errorMessage(error));
    }
  }

  return (
    <section className="plan-import-export-panel" aria-label="Plan JSON import and export">
      <div className="plan-import-export-panel__actions">
        <button type="button" onClick={exportPlan}>
          Export JSON
        </button>
        <button type="button" onClick={importPlan}>
          Import JSON
        </button>
      </div>
      <textarea
        aria-label="Plan JSON"
        value={jsonText}
        onChange={(event) => setJsonText(event.target.value)}
        spellCheck={false}
      />
      <p role="status">{status}</p>
    </section>
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
