import type { AuthoringDraftContract } from "@nerdeus/shared";

export type SavePlanControlsProps = {
  draft: AuthoringDraftContract | null;
  canSave: boolean;
  canSaveAs: boolean;
  onSave: () => void;
  onSaveAs: (displayName: string, versionLabel: string) => void;
};

export function SavePlanControls({
  draft,
  canSave,
  canSaveAs,
  onSave,
  onSaveAs
}: SavePlanControlsProps) {
  const displayName = draft == null ? "Authored floorplan" : `${draft.displayName} Copy`;
  const versionLabel = draft == null ? "v1" : `${draft.versionLabel}-copy`;
  return (
    <section className="save-plan-controls" aria-label="Save plan controls">
      <button type="button" disabled={!canSave} onClick={onSave}>
        Save
      </button>
      <button
        type="button"
        disabled={!canSaveAs}
        onClick={() => onSaveAs(displayName, versionLabel)}
      >
        Save As
      </button>
      <p role="status">
        {draft == null
          ? "No editable draft loaded"
          : `Draft ${draft.draftId} path sync ${draft.pathSyncStatus}`}
      </p>
    </section>
  );
}
