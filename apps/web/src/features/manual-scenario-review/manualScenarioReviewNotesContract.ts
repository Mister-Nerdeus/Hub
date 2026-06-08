export type ManualScenarioReviewNote = {
  noteId: string;
  scenarioId: string;
  text: string;
  createdAtIso: string;
  updatedAtIso: string;
  mode: "manual_review_note";
};

export function manualScenarioReviewNoteIdFor(input: { scenarioId: string; stableSeed: string }): string {
  return ["manual-review-note", stableIdPart(input.scenarioId), stableIdPart(input.stableSeed)].join(":");
}

export function createManualScenarioReviewNote(input: {
  scenarioId: string;
  text: string;
  createdAtIso: string;
  stableSeed: string;
}): ManualScenarioReviewNote {
  return {
    noteId: manualScenarioReviewNoteIdFor({ scenarioId: input.scenarioId, stableSeed: input.stableSeed }),
    scenarioId: input.scenarioId,
    text: input.text.trim(),
    createdAtIso: input.createdAtIso,
    updatedAtIso: input.createdAtIso,
    mode: "manual_review_note"
  };
}

function stableIdPart(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");
  return normalized.length === 0 ? "unnamed" : normalized;
}
