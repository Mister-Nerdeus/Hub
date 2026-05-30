import type {
  ActiveFloorplanContract,
  DefaultSavedPlanFixtureContract,
  PlanContract
} from "@nerdeus/shared";

import { defaultFloorplanLibraryFixtures } from "../../fixtures/defaultPlans";
import { planContractToEditableLayoutGeometry } from "../layout-editor/layoutEditorState";
import {
  findReviewCandidateFloorplan,
  type ReviewCandidateFloorplanFixture
} from "../../fixtures/reviewCandidatePlans";
import type { SavedFloorplanRecord } from "./savedFloorplanStore";
import { CANONICAL_FLOORPLAN_ID } from "./canonicalFloorplanViewModel";
import {
  ACTIVE_FLOORPLAN_ID,
  normalizeFloorplanDisplayName
} from "./floorplanVersionNaming";

export type ActiveFloorplanRecord =
  | ActiveDefaultFloorplanRecord
  | ActiveSavedFloorplanRecord
  | ActiveReviewCandidateFloorplanRecord;

export type ActiveDefaultFloorplanRecord = {
  planId: string;
  name: string;
  recordId: string;
  sourceKind: "default-json";
  readOnly: true;
  importStatus: "validated_default";
  mappingStatus: string;
  parentDefaultPlanId: null;
  plan: PlanContract;
};

export type ActiveSavedFloorplanRecord = {
  planId: string;
  name: string;
  recordId: string;
  sourceKind: "saved-json";
  readOnly: false;
  importStatus: "validated_saved";
  mappingStatus: null;
  parentDefaultPlanId: string;
  plan: PlanContract;
};

export type ActiveReviewCandidateFloorplanRecord = {
  planId: string;
  name: string;
  recordId: string;
  sourceKind: "review-candidate-json";
  readOnly: true;
  importStatus: "validated_review_candidate";
  mappingStatus: null;
  parentDefaultPlanId: string;
  candidateId: string;
  routeExportStatus: "ready";
  manualReviewStatus: "manual_review_required";
  promotionStatus: "blocked";
  plan: PlanContract;
};

export type ActiveFloorplanSelectionState = {
  selectedObjectId: string | null;
  routePreviewDraft: null;
};

export type ActiveFloorplanState = {
  activeFloorplan: ActiveFloorplanRecord | null;
  activeCanonicalFloorplanId: typeof CANONICAL_FLOORPLAN_ID;
  selectedForAssignmentVersionId: string | null;
  selectedForSimulationVersionId: string | null;
  activeFloorplanHasUnsavedChanges: boolean;
  selection: ActiveFloorplanSelectionState;
  sequence: number;
};

export type ActiveFloorplanSummaryViewModel = {
  hasActiveFloorplan: boolean;
  planId: string | null;
  recordId: string | null;
  name: string;
  readOnly: boolean;
  sourceKind: "default-json" | "saved-json" | "review-candidate-json" | null;
  sourceKindLabel: string;
  importStatus: string | null;
  mappingStatus: string | null;
  parentDefaultPlanId: string | null;
  routeStatusLabel: string;
  manualReviewStatusLabel: string;
  promotionStatusLabel: string;
  editorLaunchLabel: string;
  selectedObjectId: string | null;
  objectCounts: {
    rooms: number;
    hallways: number;
    doors: number;
    nurseStations: number;
    zones: number;
    pathNodes: number;
    pathEdges: number;
  } | null;
};

export function createEmptyActiveFloorplanState(): ActiveFloorplanState {
  return openDefaultFloorplan(
    {
      activeFloorplan: null,
      activeCanonicalFloorplanId: CANONICAL_FLOORPLAN_ID,
      selectedForAssignmentVersionId: null,
      selectedForSimulationVersionId: null,
      activeFloorplanHasUnsavedChanges: false,
      selection: createEmptySelectionState(),
      sequence: -1
    },
    CANONICAL_FLOORPLAN_ID
  );
}

export function openDefaultFloorplan(
  state: ActiveFloorplanState,
  planId: string,
  fixtures: DefaultSavedPlanFixtureContract[] = defaultFloorplanLibraryFixtures
): ActiveFloorplanState {
  if (planId !== CANONICAL_FLOORPLAN_ID) {
    throw new Error(`Cannot open legacy default floorplan as active workflow floorplan: ${planId}`);
  }
  const fixture = fixtures.find((candidate) => candidate.plan.planId === planId);
  if (fixture == null || fixture.readOnly !== true || fixture.importStatus !== "validated_default") {
    throw new Error(`Cannot open non-validated default JSON floorplan: ${planId}`);
  }

  const activeFloorplan: ActiveDefaultFloorplanRecord = {
    planId: fixture.plan.planId,
    name: fixture.plan.name,
    recordId: fixture.defaultPlanRecordId,
    sourceKind: "default-json",
    readOnly: true,
    importStatus: fixture.importStatus,
    mappingStatus: fixture.mappingId,
    parentDefaultPlanId: null,
    plan: fixture.plan
  };

  return {
    activeFloorplan,
    activeCanonicalFloorplanId: CANONICAL_FLOORPLAN_ID,
    selectedForAssignmentVersionId: activeFloorplan.recordId,
    selectedForSimulationVersionId: activeFloorplan.recordId,
    activeFloorplanHasUnsavedChanges: false,
    selection: createEmptySelectionState(),
    sequence: state.sequence + 1
  };
}

export function openDefaultFloorplanWithoutSelection(
  state: ActiveFloorplanState,
  planId: string,
  fixtures: DefaultSavedPlanFixtureContract[] = defaultFloorplanLibraryFixtures
): ActiveFloorplanState {
  const next = openDefaultFloorplan(state, planId, fixtures);
  return {
    ...next,
    selectedForAssignmentVersionId: state.selectedForAssignmentVersionId,
    selectedForSimulationVersionId: state.selectedForSimulationVersionId
  };
}

export function openSavedFloorplan(
  state: ActiveFloorplanState,
  record: SavedFloorplanRecord
): ActiveFloorplanState {
  if (record.readOnly !== false) {
    throw new Error(`Cannot open read-only saved JSON floorplan: ${record.recordId}`);
  }
  if (record.parentDefaultPlanId !== CANONICAL_FLOORPLAN_ID) {
    throw new Error(`Cannot open saved copy from non-canonical floorplan: ${record.parentDefaultPlanId}`);
  }

  const activeFloorplan: ActiveSavedFloorplanRecord = {
    planId: record.plan.planId,
    name: record.plan.name,
    recordId: record.recordId,
    sourceKind: "saved-json",
    readOnly: false,
    importStatus: "validated_saved",
    mappingStatus: null,
    parentDefaultPlanId: record.parentDefaultPlanId,
    plan: record.plan
  };

  return {
    activeFloorplan,
    activeCanonicalFloorplanId: CANONICAL_FLOORPLAN_ID,
    selectedForAssignmentVersionId: record.recordId,
    selectedForSimulationVersionId: record.recordId,
    activeFloorplanHasUnsavedChanges: false,
    selection: createEmptySelectionState(),
    sequence: state.sequence + 1
  };
}

export function cleanupActiveFloorplanAfterSavedDelete(
  state: ActiveFloorplanState,
  deletedRecordId: string
): ActiveFloorplanState {
  return state.activeFloorplan?.sourceKind === "saved-json" && state.activeFloorplan.recordId === deletedRecordId
    ? createEmptyActiveFloorplanState()
    : state;
}

export function openReviewCandidateFloorplan(
  state: ActiveFloorplanState,
  candidateId: string,
  finder: (candidateId: string) => ReviewCandidateFloorplanFixture | null = findReviewCandidateFloorplan
): ActiveFloorplanState {
  const candidate = finder(candidateId);
  if (candidate == null) {
    throw new Error(`Cannot open unknown review candidate floorplan: ${candidateId}`);
  }

  return {
    activeFloorplan: {
      planId: candidate.planId,
      name: candidate.displayName,
      recordId: candidate.savedPlanId,
      sourceKind: "review-candidate-json",
      readOnly: true,
      importStatus: "validated_review_candidate",
      mappingStatus: null,
      parentDefaultPlanId: candidate.sourceDefaultPlanId,
      candidateId: candidate.candidateId,
      routeExportStatus: "ready",
      manualReviewStatus: "manual_review_required",
      promotionStatus: "blocked",
      plan: clonePlan(candidate.plan)
    },
    activeCanonicalFloorplanId: CANONICAL_FLOORPLAN_ID,
    selectedForAssignmentVersionId: candidate.savedPlanId,
    selectedForSimulationVersionId: candidate.savedPlanId,
    activeFloorplanHasUnsavedChanges: false,
    selection: createEmptySelectionState(),
    sequence: state.sequence + 1
  };
}

export function markActiveFloorplanForAssignment(state: ActiveFloorplanState): ActiveFloorplanState {
  return {
    ...state,
    selectedForAssignmentVersionId: state.activeFloorplan?.recordId ?? null
  };
}

export function markActiveFloorplanForSimulation(state: ActiveFloorplanState): ActiveFloorplanState {
  return {
    ...state,
    selectedForSimulationVersionId: state.activeFloorplan?.recordId ?? null
  };
}

export function createActiveFloorplanContract(
  state: ActiveFloorplanState,
  savedRecords: readonly SavedFloorplanRecord[] = []
): ActiveFloorplanContract | null {
  const active = state.activeFloorplan;
  if (active == null) {
    return null;
  }
  const savedRecord = savedRecords.find((record) => record.recordId === active.recordId);
  const editableLayout = savedRecord?.authoringDraft.editableLayout
    ?? planContractToEditableLayoutGeometry(active.plan);
  const selectedForAssignment = state.selectedForAssignmentVersionId === active.recordId;
  const selectedForSimulation = state.selectedForSimulationVersionId === active.recordId;

  return {
    schemaVersion: "1.0.0",
    activeFloorplanId: ACTIVE_FLOORPLAN_ID,
    activeFloorplanVersionId: active.recordId,
    displayName: normalizeFloorplanDisplayName(savedRecord?.displayName ?? active.name),
    sourceKind: active.sourceKind === "default-json"
      ? "canonical_default"
      : active.sourceKind === "saved-json"
        ? "saved_version"
        : "imported_json",
    workflowStatus: workflowStatusForActiveFloorplan({
      active,
      selectedForAssignment,
      selectedForSimulation,
      hasUnsavedChanges: state.activeFloorplanHasUnsavedChanges
    }),
    editableLayout,
    savedAt: savedRecord?.updatedAt ?? null,
    hasUnsavedChanges: state.activeFloorplanHasUnsavedChanges,
    selectedForAssignment,
    selectedForSimulation
  };
}

export function createActiveFloorplanSummaryViewModel(
  state: ActiveFloorplanState
): ActiveFloorplanSummaryViewModel {
  const floorplan = state.activeFloorplan;
  if (floorplan == null) {
    return {
      hasActiveFloorplan: false,
      planId: null,
      recordId: null,
      name: "Canonical Plan 1 ready",
      readOnly: false,
      sourceKind: null,
      sourceKindLabel: "Canonical default",
      importStatus: null,
      mappingStatus: null,
      parentDefaultPlanId: null,
      routeStatusLabel: "Route/export not evaluated for active copy",
      manualReviewStatusLabel: "Manual review not claimed",
      promotionStatusLabel: "Promotion blocked",
      editorLaunchLabel: "Open canonical floorplan",
      selectedObjectId: state.selection.selectedObjectId,
      objectCounts: null
    };
  }

  return {
    hasActiveFloorplan: true,
    planId: floorplan.planId,
    recordId: floorplan.recordId,
    name: floorplan.name,
    readOnly: floorplan.readOnly,
    sourceKind: floorplan.sourceKind,
    sourceKindLabel: sourceKindLabel(floorplan),
    importStatus: floorplan.importStatus,
    mappingStatus: floorplan.mappingStatus,
    parentDefaultPlanId: floorplan.parentDefaultPlanId,
    routeStatusLabel: routeStatusLabel(floorplan),
    manualReviewStatusLabel: manualReviewStatusLabel(floorplan),
    promotionStatusLabel: promotionStatusLabel(floorplan),
    editorLaunchLabel: "Launch editor from active floorplan",
    selectedObjectId: state.selection.selectedObjectId,
    objectCounts: {
      rooms: floorplan.plan.rooms.length,
      hallways: floorplan.plan.hallways.length,
      doors: floorplan.plan.doors.length,
      nurseStations: floorplan.plan.nurseStations.length,
      zones: floorplan.plan.zones.length,
      pathNodes: floorplan.plan.pathNodes.length,
      pathEdges: floorplan.plan.pathEdges.length
    }
  };
}

function sourceKindLabel(floorplan: ActiveFloorplanRecord): string {
  if (floorplan.sourceKind === "review-candidate-json") {
    return "Route-repaired review candidate";
  }
  if (floorplan.sourceKind === "saved-json") {
    return "Saved editable copy";
  }
  return "Read-only default fixture";
}

function workflowStatusForActiveFloorplan(input: {
  active: ActiveFloorplanRecord;
  selectedForAssignment: boolean;
  selectedForSimulation: boolean;
  hasUnsavedChanges: boolean;
}): ActiveFloorplanContract["workflowStatus"] {
  if (input.hasUnsavedChanges) {
    return "draft";
  }
  if (input.selectedForSimulation) {
    return "ready_for_simulation";
  }
  if (input.selectedForAssignment) {
    return "ready_for_assignment";
  }
  return input.active.sourceKind === "saved-json" || input.active.sourceKind === "default-json"
    ? "saved"
    : "draft";
}

function routeStatusLabel(floorplan: ActiveFloorplanRecord): string {
  return floorplan.sourceKind === "review-candidate-json"
    ? "Route/export ready"
    : "Route/export not evaluated for active copy";
}

function manualReviewStatusLabel(floorplan: ActiveFloorplanRecord): string {
  return floorplan.sourceKind === "review-candidate-json"
    ? "Manual review required"
    : "Manual review not claimed";
}

function promotionStatusLabel(_floorplan: ActiveFloorplanRecord): string {
  return "Promotion blocked";
}

function createEmptySelectionState(): ActiveFloorplanSelectionState {
  return {
    selectedObjectId: null,
    routePreviewDraft: null
  };
}

function clonePlan(plan: PlanContract): PlanContract {
  return JSON.parse(JSON.stringify(plan)) as PlanContract;
}
