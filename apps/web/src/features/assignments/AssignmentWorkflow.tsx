import { useMemo, useReducer, useState } from "react";
import {
  buildPlan1AssignmentComparisonOutputs,
  buildPlan1AssignmentWalkingPreviews,
  buildPlan1NurseAssignmentSummaries,
  createPlan1AssignmentWorkflowState,
  scorePlan1AssignmentBurden,
  validatePlan1AssignmentComparisonFixtures,
  validatePlan1AssignmentsForOperations,
  type PlanContract
} from "@nerdeus/shared";

import { defaultPlan1RenderProofFixture } from "../../fixtures/defaultPlans";
import comparisonFixture from "../../../../../packages/shared/fixtures/assignments/plan-1/assignment-comparison-fixtures.json" with { type: "json" };
import { AssignmentComparisonPanel } from "./AssignmentComparisonPanel";
import { AssignmentPaintMode } from "./AssignmentPaintMode";
import { AssignmentValidationPanel } from "./AssignmentValidationPanel";
import { BurdenScorePanel } from "./BurdenScorePanel";
import { getDefaultPlan1ManualAssignments, createManualAssignmentPaintState, manualAssignmentReducer } from "./manualAssignmentState";
import { NurseAssignmentCards } from "./NurseAssignmentCards";
import { NurseProfilePanel } from "./NurseProfilePanel";
import { getDefaultPlan1SyntheticNurseProfiles } from "./nurseProfiles";
import { RoomLoadEditor } from "./RoomLoadEditor";
import { getDefaultPlan1RoomLoads } from "./roomLoadState";
import "./AssignmentWorkflow.css";

export function AssignmentWorkflow({ activePlan }: { activePlan?: PlanContract | null }) {
  const planIsActivePlan1 = activePlan?.planId === "default-er-layout-plan-1";
  const plan = planIsActivePlan1 ? activePlan : defaultPlan1RenderProofFixture.plan;
  const defaultNurses = useMemo(() => getDefaultPlan1SyntheticNurseProfiles(plan), [plan]);
  const defaultRoomLoads = useMemo(() => getDefaultPlan1RoomLoads(plan), [plan]);
  const [nurses, setNurses] = useState(defaultNurses);
  const [roomLoads, setRoomLoads] = useState(defaultRoomLoads);
  const initialAssignments = useMemo(() => getDefaultPlan1ManualAssignments(plan, nurses), [plan, nurses]);
  const [paintState, dispatch] = useReducer(
    manualAssignmentReducer,
    createManualAssignmentPaintState(initialAssignments, nurses[0]?.nurseId ?? "nurse-blue")
  );
  if (!planIsActivePlan1) {
    const scopeValidation = validatePlan1AssignmentsForOperations({
      plan: activePlan ?? null,
      nurses: [],
      roomLoads: [],
      assignments: [],
      stalePathSync: false
    });
    return (
      <div
        className="assignment-workflow"
        data-plan-id={activePlan?.planId ?? ""}
        data-assignment-stage="validation"
        data-plan-1-scope="blocked"
      >
        <AssignmentValidationPanel warnings={scopeValidation.warnings} />
      </div>
    );
  }
  const workflowState = createPlan1AssignmentWorkflowState({
    plan,
    nurses,
    roomLoads,
    assignments: paintState.assignments,
    pathSyncStatus: "fresh"
  });
  const validation = validatePlan1AssignmentsForOperations({
    plan,
    nurses: workflowState.nurses,
    roomLoads: workflowState.roomLoads,
    assignments: workflowState.assignments,
    stalePathSync: workflowState.pathSyncStatus !== "fresh"
  });
  const walkingPreviews = buildPlan1AssignmentWalkingPreviews({
    plan,
    nurses: workflowState.nurses,
    assignments: workflowState.assignments,
    stalePathSync: workflowState.pathSyncStatus !== "fresh"
  });
  const summaries = buildPlan1NurseAssignmentSummaries({
    plan,
    nurses: workflowState.nurses,
    roomLoads: workflowState.roomLoads,
    assignments: workflowState.assignments,
    warnings: validation.warnings,
    walkingPreviews
  });
  const burdenScore = scorePlan1AssignmentBurden({
    nurses: workflowState.nurses,
    roomLoads: workflowState.roomLoads,
    assignments: workflowState.assignments,
    walkingPreviews,
    warnings: validation.warnings
  });
  const comparisons = buildPlan1AssignmentComparisonOutputs({
    plan,
    fixtures: validatePlan1AssignmentComparisonFixtures(comparisonFixture, plan)
  });
  return (
    <div className="assignment-workflow" data-plan-id={plan.planId} data-assignment-stage="final">
      <NurseProfilePanel
        nurses={nurses}
        onUpdateNurse={(updatedNurse) =>
          setNurses((current) =>
            current.map((nurse) => nurse.nurseId === updatedNurse.nurseId ? updatedNurse : nurse)
          )
        }
      />
      <RoomLoadEditor
        plan={plan}
        roomLoads={roomLoads}
        onUpdateRoomLoad={(updatedRoomLoad) =>
          setRoomLoads((current) =>
            current.map((roomLoad) => roomLoad.roomId === updatedRoomLoad.roomId ? updatedRoomLoad : roomLoad)
          )
        }
      />
      <AssignmentPaintMode
        plan={plan}
        nurses={workflowState.nurses}
        assignments={workflowState.assignments}
        selectedNurseId={paintState.selectedNurseId}
        onSelectNurse={(nurseId) => dispatch({ type: "selectNurse", nurseId })}
        onToggleRoom={(roomId) => dispatch({ type: "togglePrimaryRoom", roomId })}
      />
      <AssignmentValidationPanel warnings={validation.warnings} />
      <NurseAssignmentCards summaries={summaries} />
      <BurdenScorePanel burdenScore={burdenScore} />
      <AssignmentComparisonPanel comparisons={comparisons} />
    </div>
  );
}
