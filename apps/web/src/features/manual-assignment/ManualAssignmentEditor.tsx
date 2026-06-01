import { useMemo, useState } from "react";
import {
  canonicalErPodGeometryFixture,
  deriveRouteGraphFromGeometry,
  manualStaffFixture,
  resolveAssignmentTargetsFromFloorplan,
  validateManualAssignmentSetReferences,
  type ActiveFloorplanContract,
  type AssignmentFoundationTargetContract,
  type ManualAssignmentSetContract
} from "@nerdeus/shared";
import { AssignmentTargetListPanel } from "./AssignmentTargetListPanel";
import { ManualAssignmentControls } from "./ManualAssignmentControls";
import {
  addManualAssignmentToSet,
  createManualAssignmentEditorState,
  removeManualAssignmentFromSet
} from "./manualAssignmentState";
import { readManualAssignmentSet, writeManualAssignmentSet } from "./manualAssignmentStorage";
import { createAssignmentValidationViewModel } from "./assignmentValidationViewModel";
import { StaffListPanel } from "./StaffListPanel";
import "./ManualAssignmentFoundation.css";

type ManualAssignmentEditorProps = {
  activeFloorplan?: ActiveFloorplanContract | null;
  assignmentSet?: ManualAssignmentSetContract | null;
  onAssignmentSetChange?: (assignmentSet: ManualAssignmentSetContract) => void;
};

export function ManualAssignmentEditor({
  activeFloorplan = null,
  assignmentSet = null,
  onAssignmentSetChange
}: ManualAssignmentEditorProps) {
  const activeLayout = activeFloorplan?.editableLayout ?? null;
  const layout = activeLayout != null && (activeLayout.splitRooms?.length ?? 0) > 0
    ? activeLayout
    : canonicalErPodGeometryFixture;
  const routeGraph = useMemo(() => deriveRouteGraphFromGeometry(layout), [layout]);
  const assignmentTargets = useMemo(
    () => resolveAssignmentTargetsFromFloorplan(layout, { routeGraph }),
    [layout, routeGraph]
  );
  const initialSet = assignmentSet ?? readManualAssignmentSet(getLocalStorage());
  const [state, setState] = useState(() =>
    createManualAssignmentEditorState({
      floorplanId: layout.layoutId,
      staffMembers: manualStaffFixture,
      assignmentTargets,
      initialAssignmentSet: initialSet?.floorplanId === layout.layoutId ? initialSet : null
    })
  );
  const validation = validateManualAssignmentSetReferences({
    assignmentSet: state.assignmentSet,
    staffMembers: manualStaffFixture,
    assignmentTargets,
    routeGraph
  });
  const validationViewModel = createAssignmentValidationViewModel(validation);
  const selectedTarget = assignmentTargets.find(
    (target) => target.assignmentTargetId === state.selectedAssignmentTargetId
  ) ?? null;

  function updateAssignmentSet(nextSet: ManualAssignmentSetContract) {
    setState((current) => ({ ...current, assignmentSet: nextSet }));
    onAssignmentSetChange?.(nextSet);
  }

  function addAssignment() {
    if (selectedTarget == null || state.selectedStaffMemberId.length === 0) return;
    updateAssignmentSet(addManualAssignmentToSet({
      assignmentSet: state.assignmentSet,
      staffMemberId: state.selectedStaffMemberId,
      assignmentTarget: selectedTarget
    }));
  }

  function saveAssignmentSet() {
    updateAssignmentSet(writeManualAssignmentSet(getLocalStorage(), state.assignmentSet));
  }

  return (
    <section
      className="manual-foundation-editor"
      data-manual-assignment-editor="true"
      data-assignment-scope="manual_only"
      aria-labelledby="manual-foundation-title"
    >
      <header className="manual-foundation-editor__header">
        <h2 id="manual-foundation-title">Manual Assignment</h2>
      </header>
      <ManualAssignmentControls
        canAddAssignment={selectedTarget != null && state.selectedStaffMemberId.length > 0}
        onAddAssignment={addAssignment}
        onSaveAssignmentSet={saveAssignmentSet}
      />
      <div className="manual-foundation-editor__grid">
        <StaffListPanel
          staffMembers={manualStaffFixture}
          selectedStaffMemberId={state.selectedStaffMemberId}
          onSelectStaffMember={(staffMemberId) =>
            setState((current) => ({ ...current, selectedStaffMemberId: staffMemberId }))
          }
        />
        <AssignmentTargetListPanel
          assignmentTargets={assignmentTargets}
          selectedAssignmentTargetId={state.selectedAssignmentTargetId}
          onSelectAssignmentTarget={(assignmentTargetId) =>
            setState((current) => ({ ...current, selectedAssignmentTargetId: assignmentTargetId }))
          }
        />
      </div>
      <section className="manual-foundation-panel" aria-labelledby="manual-current-title">
        <h3 id="manual-current-title">Manual assignment</h3>
        <ul className="manual-foundation-assignment-list">
          {state.assignmentSet.assignments.map((assignment) => (
            <li key={assignment.assignmentId} data-manual-assignment-id={assignment.assignmentId}>
              <span>{assignmentLabel(assignment.assignmentTargetId, assignmentTargets)} assigned to {staffLabel(assignment.staffMemberId)}</span>
              <button
                type="button"
                onClick={() => updateAssignmentSet(removeManualAssignmentFromSet({
                  assignmentSet: state.assignmentSet,
                  assignmentId: assignment.assignmentId
                }))}
              >
                Remove assignment
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className="manual-foundation-panel" aria-labelledby="manual-validation-title">
        <h3 id="manual-validation-title">{validationViewModel.title}</h3>
        <ul className="manual-foundation-validation">
          {validationViewModel.items.length === 0 ? <li>No validation messages</li> : validationViewModel.items.map((item) => (
            <li key={`${item.code}:${item.message}`} data-validation-severity={item.severity}>
              {item.message}
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}

function assignmentLabel(
  assignmentTargetId: string,
  assignmentTargets: readonly AssignmentFoundationTargetContract[]
): string {
  return assignmentTargets.find((target) => target.assignmentTargetId === assignmentTargetId)?.displayLabel ?? "Assignment target";
}

function staffLabel(staffMemberId: string): string {
  return manualStaffFixture.find((staff) => staff.staffMemberId === staffMemberId)?.displayName ?? "Staff";
}

function getLocalStorage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}
