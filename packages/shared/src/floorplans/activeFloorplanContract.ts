import type { EditableLayoutGeometryContract } from "../layout-editor/editableLayoutGeometryContract.js";

export type ActiveFloorplanWorkflowStatus =
  | "no_floorplan_selected"
  | "draft"
  | "saved"
  | "ready_for_assignment"
  | "ready_for_simulation"
  | "archived";

export type ActiveFloorplanContract = {
  schemaVersion: "1.0.0";
  activeFloorplanId: string;
  activeFloorplanVersionId: string;
  displayName: string;
  sourceKind: "canonical_default" | "saved_version" | "imported_json";
  workflowStatus: ActiveFloorplanWorkflowStatus;
  editableLayout: EditableLayoutGeometryContract;
  savedAt: string | null;
  hasUnsavedChanges: boolean;
  selectedForAssignment: boolean;
  selectedForSimulation: boolean;
};
