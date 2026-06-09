import { useState } from "react";
import type { ManualScenarioContract, ManualScenarioSnapshotContract } from "@nerdeus/shared";
import {
  type ManualScenarioReviewNote
} from "./manualScenarioReviewNotesContract";
import {
  addManualScenarioReviewNote,
  createManualScenarioReviewNotesState,
  deleteManualScenarioReviewNote,
  editManualScenarioReviewNote
} from "./manualScenarioReviewNotesState";
import { createManualScenarioReviewViewModel } from "./manualScenarioReviewViewModel";
import "./ManualScenarioReview.css";

type ManualScenarioReviewPanelProps = {
  scenarios: readonly ManualScenarioContract[];
  snapshots: readonly ManualScenarioSnapshotContract[];
  notes: readonly ManualScenarioReviewNote[];
  onNotesChange: (notes: ManualScenarioReviewNote[]) => void;
};

export function ManualScenarioReviewPanel({
  scenarios,
  snapshots,
  notes,
  onNotesChange
}: ManualScenarioReviewPanelProps) {
  const items = createManualScenarioReviewViewModel({ scenarios, snapshots, notes });
  const [noteTextByScenarioId, setNoteTextByScenarioId] = useState<Record<string, string>>({});
  const [editTextByNoteId, setEditTextByNoteId] = useState<Record<string, string>>({});
  const [retiredNoteIds, setRetiredNoteIds] = useState<string[]>([]);

  function addNote(scenarioId: string) {
    const text = noteTextByScenarioId[scenarioId]?.trim() ?? "";
    if (text.length === 0) return;
    const createdAtIso = new Date().toISOString();
    const nextState = addManualScenarioReviewNote({
      state: { notes: [...notes], retiredNoteIds },
      scenarioId,
      text,
      createdAtIso
    });
    setRetiredNoteIds(nextState.retiredNoteIds);
    onNotesChange(nextState.notes);
    setNoteTextByScenarioId((state) => ({ ...state, [scenarioId]: "" }));
  }

  function editNote(noteId: string) {
    const text = editTextByNoteId[noteId]?.trim() ?? "";
    if (text.length === 0) return;
    const nextState = editManualScenarioReviewNote({
      state: createManualScenarioReviewNotesState(notes),
      noteId,
      text,
      updatedAtIso: new Date().toISOString()
    });
    onNotesChange(nextState.notes);
    setEditTextByNoteId((state) => {
      const next = { ...state };
      delete next[noteId];
      return next;
    });
  }

  function deleteNote(noteId: string) {
    const nextState = deleteManualScenarioReviewNote({
      state: { notes: [...notes], retiredNoteIds },
      noteId
    });
    setRetiredNoteIds(nextState.retiredNoteIds);
    onNotesChange(nextState.notes);
  }

  return (
    <section
      className="manual-scenario-review-panel"
      data-manual-scenario-review-panel="true"
      data-review-scope="reference_state_review_only"
      data-review-scoring-blocked="true"
      data-review-simulation-blocked="true"
      data-review-recommendations-blocked="true"
      data-review-clinical-claims-blocked="true"
    >
      <header className="manual-scenario-review-panel__header">
        <div>
          <h3>Manual Scenario Review</h3>
          <p>Reference and state review only.</p>
        </div>
        <strong>Manual review</strong>
      </header>
      {items.length === 0 ? (
        <p className="manual-scenario-review-panel__empty">Create a manual scenario before review.</p>
      ) : (
        <ul className="manual-scenario-review-list">
          {items.map((item) => (
            <li key={item.scenarioId}>
              <div className="manual-scenario-review-list__summary">
                <strong>{item.label}</strong>
                <span>{item.statusCopy}</span>
              </div>
              <dl>
                <div>
                  <dt>Floorplan</dt>
                  <dd>{item.floorplanCopy}</dd>
                </div>
                <div>
                  <dt>Assignment set</dt>
                  <dd>{item.assignmentSetCopy}</dd>
                </div>
                <div>
                  <dt>Staff roster</dt>
                  <dd>{item.staffRosterCopy}</dd>
                </div>
                <div>
                  <dt>Snapshot</dt>
                  <dd>{item.snapshotCopy}</dd>
                </div>
                <div>
                  <dt>Manual notes count</dt>
                  <dd>{item.notesCount}</dd>
                </div>
              </dl>
              {item.issueCopies.length === 0 ? null : (
                <ul className="manual-scenario-review-list__issues">
                  {item.issueCopies.map((copy) => <li key={copy}>{copy}</li>)}
                </ul>
              )}
              <div className="manual-scenario-review-notes-panel" data-review-notes-panel="true">
                <p data-review-notes-no-phi-reminder="true">Do not enter patient names or identifying patient information.</p>
                <ul className="manual-scenario-review-notes-list">
                  {notes.filter((note) => note.scenarioId === item.scenarioId).map((note) => {
                    const draftEdit = editTextByNoteId[note.noteId] ?? note.text;
                    return (
                      <li key={note.noteId}>
                        <div>
                          <strong>{note.text}</strong>
                          <span>Created {formatIso(note.createdAtIso)} · Updated {formatIso(note.updatedAtIso)}</span>
                        </div>
                        <label>
                          <span>Edit note</span>
                          <input
                            value={draftEdit}
                            onChange={(event) =>
                              setEditTextByNoteId((state) => ({
                                ...state,
                                [note.noteId]: event.target.value
                              }))
                            }
                          />
                        </label>
                        <div className="manual-scenario-review-note-actions">
                          <button
                            type="button"
                            data-review-note-edit="true"
                            disabled={draftEdit.trim().length === 0}
                            onClick={() => editNote(note.noteId)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            data-review-note-delete="true"
                            onClick={() => deleteNote(note.noteId)}
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="manual-scenario-review-note-row">
                <label>
                  <span>Manual note</span>
                  <input
                    value={noteTextByScenarioId[item.scenarioId] ?? ""}
                    onChange={(event) =>
                      setNoteTextByScenarioId((state) => ({
                        ...state,
                        [item.scenarioId]: event.target.value
                      }))
                    }
                  />
                </label>
                <button
                  type="button"
                  data-review-note-add="true"
                  disabled={(noteTextByScenarioId[item.scenarioId]?.trim() ?? "").length === 0}
                  onClick={() => addNote(item.scenarioId)}
                >
                  Add note
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatIso(value: string): string {
  return new Date(value).toISOString();
}
