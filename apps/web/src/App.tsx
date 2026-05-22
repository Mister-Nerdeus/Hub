import { useReducer } from "react";
import type { PlanContract } from "@nerdeus/shared";

import { PlanDraftPanel } from "./features/plan-builder/PlanDraftPanel";
import { planDraftReducer } from "./features/plan-builder/planDraftReducer";
import { PlanRenderer } from "./features/plan-renderer/PlanRenderer";
import { PlanImportExportPanel } from "./features/plans/PlanImportExportPanel";
import { PlanSaveLoadPanel } from "./features/plans/PlanSaveLoadPanel";
import { planErPodPhase2 } from "./fixtures/planErPodPhase2";

export function App() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010";
  const [draftPlan, dispatchDraft] = useReducer(
    planDraftReducer,
    planErPodPhase2 as PlanContract
  );

  return (
    <main className="app-shell">
      <section className="workspace-header" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Operational simulation workspace</p>
          <h1 id="page-title">Nerdeus ER Pod Shift Simulator</h1>
        </div>
        <div className="api-pill" aria-label="Configured API base URL">
          <span>API</span>
          <strong>{apiBaseUrl}</strong>
        </div>
      </section>

      <PlanDraftPanel plan={draftPlan} dispatch={dispatchDraft} />
      <PlanSaveLoadPanel
        apiBaseUrl={apiBaseUrl}
        draftPlan={draftPlan}
        onLoadPlan={(plan) => dispatchDraft({ type: "replacePlan", plan })}
      />
      <PlanImportExportPanel
        draftPlan={draftPlan}
        onImportPlan={(plan) => dispatchDraft({ type: "replacePlan", plan })}
      />
      <PlanRenderer plan={draftPlan} />
    </main>
  );
}
