import {
  createManualScenarioReviewNote,
  manualScenarioReviewNoteIdFor,
  validateManualScenarioReviewNotes,
  type ManualScenarioReviewNote
} from "./manualScenarioReviewNotesContract";

export type ManualScenarioReviewNotesState = {
  notes: ManualScenarioReviewNote[];
  retiredNoteIds: string[];
};

export function createManualScenarioReviewNotesState(
  notes: readonly ManualScenarioReviewNote[] = []
): ManualScenarioReviewNotesState {
  return {
    notes: validateManualScenarioReviewNotes({ notes }),
    retiredNoteIds: []
  };
}

export function addManualScenarioReviewNote(input: {
  state: ManualScenarioReviewNotesState;
  scenarioId: string;
  text: string;
  createdAtIso: string;
}): ManualScenarioReviewNotesState {
  const stableSeed = nextManualReviewNoteStableSeed({
    scenarioId: input.scenarioId,
    createdAtIso: input.createdAtIso,
    notes: input.state.notes,
    retiredNoteIds: input.state.retiredNoteIds
  });
  const note = createManualScenarioReviewNote({
    scenarioId: input.scenarioId,
    text: input.text,
    createdAtIso: input.createdAtIso,
    stableSeed
  });
  return {
    ...input.state,
    notes: validateManualScenarioReviewNotes({ notes: [...input.state.notes, note] })
  };
}

export function editManualScenarioReviewNote(input: {
  state: ManualScenarioReviewNotesState;
  noteId: string;
  text: string;
  updatedAtIso: string;
}): ManualScenarioReviewNotesState {
  return {
    ...input.state,
    notes: validateManualScenarioReviewNotes({
      notes: input.state.notes.map((note) => note.noteId === input.noteId
        ? { ...note, text: input.text, updatedAtIso: input.updatedAtIso }
        : note)
    })
  };
}

export function deleteManualScenarioReviewNote(input: {
  state: ManualScenarioReviewNotesState;
  noteId: string;
}): ManualScenarioReviewNotesState {
  const exists = input.state.notes.some((note) => note.noteId === input.noteId);
  return {
    notes: input.state.notes.filter((note) => note.noteId !== input.noteId),
    retiredNoteIds: exists
      ? Array.from(new Set([...input.state.retiredNoteIds, input.noteId]))
      : input.state.retiredNoteIds
  };
}

export function nextManualReviewNoteStableSeed(input: {
  scenarioId: string;
  createdAtIso: string;
  notes: readonly ManualScenarioReviewNote[];
  retiredNoteIds: readonly string[];
}): string {
  const unavailable = new Set([
    ...input.notes.map((note) => note.noteId),
    ...input.retiredNoteIds
  ]);
  for (let index = 1; index <= unavailable.size + 2; index += 1) {
    const stableSeed = `${input.createdAtIso}:${index}`;
    const candidateId = manualScenarioReviewNoteIdFor({ scenarioId: input.scenarioId, stableSeed });
    if (!unavailable.has(candidateId)) return stableSeed;
  }
  throw new Error("manualScenarioReviewNote stableSeed collision could not be resolved");
}
