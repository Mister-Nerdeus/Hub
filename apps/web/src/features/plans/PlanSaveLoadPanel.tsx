import { useState } from "react";
import { validatePlanContract, type PlanContract } from "@nerdeus/shared";

import { createPlan, getPlan, listPlans, updatePlan, type PlanSummaryResponse } from "./planApi";
import "./PlanSaveLoadPanel.css";

type PlanSaveLoadPanelProps = {
  apiBaseUrl: string;
  draftPlan: PlanContract;
  onLoadPlan: (plan: PlanContract) => void;
};

export function PlanSaveLoadPanel({ apiBaseUrl, draftPlan, onLoadPlan }: PlanSaveLoadPanelProps) {
  const [plans, setPlans] = useState<PlanSummaryResponse[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState(draftPlan.planId);
  const [status, setStatus] = useState("Ready");

  async function refreshPlans(preferredPlanId = selectedPlanId) {
    try {
      const response = await listPlans(apiBaseUrl);
      setPlans(response.plans);
      if (response.plans.some((plan) => plan.id === preferredPlanId)) {
        setSelectedPlanId(preferredPlanId);
      } else if (response.plans[0]) {
        setSelectedPlanId(response.plans[0].id);
      }
      setStatus(`Loaded ${response.plans.length} saved plan records`);
    } catch (error) {
      setStatus(errorMessage(error));
    }
  }

  async function saveDraft() {
    try {
      const validDraft = validatePlanContract(draftPlan);
      try {
        await createPlan(apiBaseUrl, validDraft, "Saved operational layout");
      } catch (error) {
        if (!(error instanceof Error) || !error.message.includes("409")) {
          throw error;
        }
        await updatePlan(apiBaseUrl, validDraft.planId, validDraft, "Saved operational layout");
      }
      await refreshPlans(validDraft.planId);
      setStatus(`Saved ${validDraft.planId}`);
    } catch (error) {
      setStatus(errorMessage(error));
    }
  }

  async function saveCopy() {
    try {
      const copyIndex = plans.length + 1;
      const copy = validatePlanContract({
        ...draftPlan,
        planId: `${draftPlan.planId}-copy-${copyIndex}`,
        name: `${draftPlan.name} Copy ${copyIndex}`
      });
      await createPlan(apiBaseUrl, copy, "Saved operational layout copy");
      await refreshPlans(copy.planId);
      setStatus(`Saved ${copy.planId}`);
    } catch (error) {
      setStatus(errorMessage(error));
    }
  }

  async function loadSelectedPlan() {
    try {
      const response = await getPlan(apiBaseUrl, selectedPlanId);
      const validLayout = validatePlanContract(response.layout);
      onLoadPlan(validLayout);
      setStatus(`Loaded ${validLayout.planId}`);
    } catch (error) {
      setStatus(errorMessage(error));
    }
  }

  return (
    <section className="plan-save-load-panel" aria-label="Plan save and load controls">
      <div className="plan-save-load-panel__actions">
        <button type="button" onClick={saveDraft}>
          Save Draft
        </button>
        <button type="button" onClick={saveCopy}>
          Save Copy
        </button>
        <button type="button" onClick={() => void refreshPlans()}>
          Refresh
        </button>
      </div>
      <label className="plan-save-load-panel__select">
        Saved plans
        <select value={selectedPlanId} onChange={(event) => setSelectedPlanId(event.target.value)}>
          {plans.length === 0 ? <option value={draftPlan.planId}>{draftPlan.planId}</option> : null}
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </select>
      </label>
      <button type="button" onClick={loadSelectedPlan}>
        Load Selected
      </button>
      <p role="status">{status}</p>
    </section>
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
