import { useState } from "react";
import type { ManualScenarioContract, ManualScenarioSnapshotContract } from "@nerdeus/shared";
import {
  createManualScenarioReviewNote,
  type ManualScenarioReviewNote
} from "./manualScenarioReviewNotesContract";
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

  function addNote(scenarioId: string) {
    const text = noteTextByScenarioId[scenarioId]?.trim() ?? "";
    if (text.length === 0) return;
    const createdAtIso = new Date().toISOString();
    const note = createManualScenarioReviewNote({
      scenarioId,
      text,
      createdAtIso,
      stableSeed: String(notes.length + 1)
    });
    onNotesChange([...notes, note]);
    setNoteTextByScenarioId((state) => ({ ...state, [scenarioId]: "" }));
  }

  return (
    <section className="manual-scenario-review-panel" data-manual-scenario-review-panel="true">
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
                <button type="button" onClick={() => addNote(item.scenarioId)}>Add note</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
