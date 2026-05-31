import type { AssignmentSetContract } from "@nerdeus/shared";
import { createAssignmentSetSelectorViewModel } from "./assignmentSetSelectorViewModel";

type AssignmentSetSelectorProps = {
  assignmentSets: AssignmentSetContract[];
  activeAssignmentSet: AssignmentSetContract | null;
  selectedScenarioAssignmentSet: AssignmentSetContract | null;
  activeFloorplanVersionId: string | null;
  saveMessage: string | null;
  onSelectAssignmentSet: (assignmentSetId: string) => void;
  onSaveAssignmentSet: () => void;
  onUseForScenarioSetup: () => void;
};

export function AssignmentSetSelector({
  assignmentSets,
  activeAssignmentSet,
  selectedScenarioAssignmentSet,
  activeFloorplanVersionId,
  saveMessage,
  onSelectAssignmentSet,
  onSaveAssignmentSet,
  onUseForScenarioSetup
}: AssignmentSetSelectorProps) {
  const viewModel = createAssignmentSetSelectorViewModel({
    assignmentSets,
    activeAssignmentSet,
    selectedScenarioAssignmentSet,
    activeFloorplanVersionId
  });
  return (
    <section
      className="assignment-set-selector"
      aria-labelledby="assignment-set-selector-title"
      data-assignment-set-selector="manual-workflow"
      data-active-assignment-set-id={viewModel.activeAssignmentSetId ?? ""}
      data-selected-scenario-assignment-set-id={viewModel.selectedScenarioAssignmentSetId ?? ""}
    >
      <div className="assignment-set-selector__header">
        <div>
          <p className="eyebrow">Assignment set</p>
          <h3 id="assignment-set-selector-title">Save and hand off</h3>
        </div>
        <div className="assignment-set-selector__actions">
          <button type="button" onClick={onSaveAssignmentSet} disabled={activeAssignmentSet == null}>
            Save Assignment Set
          </button>
          <button type="button" onClick={onUseForScenarioSetup} disabled={activeAssignmentSet == null}>
            Use for Scenario Setup
          </button>
        </div>
      </div>
      <div className="assignment-set-selector__options" role="list">
        {viewModel.options.map((option) => (
          <button
            className={option.active ? "assignment-set-selector__option assignment-set-selector__option--active" : "assignment-set-selector__option"}
            key={option.assignmentSetId}
            type="button"
            role="listitem"
            data-assignment-set-option-id={option.assignmentSetId}
            data-assignment-set-compatible={option.compatibilityStatus === "compatible" ? "true" : "false"}
            data-assignment-set-selected-for-scenario={option.selectedForScenario ? "true" : "false"}
            onClick={() => onSelectAssignmentSet(option.assignmentSetId)}
          >
            <span>{option.displayName}</span>
            <strong>{option.assignedRoomCount} assigned</strong>
            <small>{option.roomLoadCount} structured room loads / {option.status}</small>
          </button>
        ))}
      </div>
      {saveMessage == null ? null : <p className="assignment-set-selector__message" role="status">{saveMessage}</p>}
    </section>
  );
}
