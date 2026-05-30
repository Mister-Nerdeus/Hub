import {
  createSafeSourceProvenance,
  buildPlanContractFromEditableLayout,
  validateAuthoringDraftContract,
  validatePlanContract,
  validateSavedPlanRecordContract,
  type AuthoringDraftContract,
  type EditableFloorplanCopy,
  type PlanContract,
  type SavedPlanRecordContract,
  type SaveKind
} from "@nerdeus/shared";
import { planContractToEditableLayoutGeometry } from "../layout-editor/layoutEditorState";
import { recordSavedRecordTraceStage } from "../layout-editor/layoutSaveTrace";
import type { SavedFloorplanPersistence } from "./savedFloorplanPersistence";

export type SavedFloorplanRecord = {
  savedPlanId: string;
  recordId: string;
  readOnly: false;
  parentDefaultPlanId: string;
  sourceDefaultPlanId: string;
  planId: string;
  displayName: string;
  versionLabel: string;
  createdAt: string;
  updatedAt: string;
  saveKind: SaveKind;
  authoringDraft: AuthoringDraftContract;
  sourceProvenance: SavedPlanRecordContract["sourceProvenance"];
  syntheticDataOnly: true;
  plan: PlanContract;
};

// Saved records preserve authored splitBays through the validated plan and authoring-draft contracts.
export type SavedFloorplanStore = {
  list(): SavedFloorplanRecord[];
  save(copy: EditableFloorplanCopy): SavedFloorplanRecord;
  saveDraft(savedPlanId: string, draft: AuthoringDraftContract): SavedFloorplanRecord;
  saveAsDraft(draft: AuthoringDraftContract, options: { displayName: string; versionLabel: string }): SavedFloorplanRecord;
  load(recordId: string): SavedFloorplanRecord | null;
  delete(recordId: string): boolean;
};

const FORBIDDEN_SAVED_PAYLOAD_KEYS = [
  `sourceDocument${"Path"}`,
  `docx${"Binary"}`,
  "binaryData",
  "rawFileContent",
  "base64Content",
  "embeddedDocument",
  `source${"Filename"}`,
  "privateAbsolutePath"
];

export function createSavedFloorplanStore(
  persistence: SavedFloorplanPersistence | null = null
): SavedFloorplanStore {
  const records = new Map<string, SavedFloorplanRecord>();
  for (const persisted of persistence?.load() ?? []) {
    const record = webRecordFromContract(persisted);
    if (records.has(record.savedPlanId)) {
      throw new Error(`duplicate saved floorplan record: ${record.savedPlanId}`);
    }
    records.set(record.savedPlanId, cloneSavedRecord(record));
  }
  let nextSequence = records.size + 1;

  const persist = () => {
    persistence?.save([...records.values()].map(savedRecordToContract));
  };

  return {
    list() {
      return [...records.values()].map(cloneSavedRecord).sort((left, right) =>
        left.savedPlanId.localeCompare(right.savedPlanId)
      );
    },
    save(copy) {
      const record = createSavedRecord(copy, {
        savedPlanId: nextSavedPlanId(copy.parentDefaultPlanId, nextSequence++),
        saveKind: "default_duplicate",
        versionLabel: `v${nextSequence - 1}`
      });
      records.set(record.savedPlanId, cloneSavedRecord(record));
      persist();
      recordSavedRecordTraceStage("savedRecordPayload", record);
      return cloneSavedRecord(record);
    },
    saveDraft(savedPlanId, draft) {
      const existing = records.get(savedPlanId);
      if (existing == null) {
        throw new Error(`unknown saved floorplan record: ${savedPlanId}`);
      }
      const validatedDraft = validateAuthoringDraftContract(draft);
      const record = webRecordFromContract(
        validateSavedPlanRecordContract({
          savedPlanId,
          sourceDefaultPlanId: existing.sourceDefaultPlanId,
          planId: validatedDraft.planId,
          displayName: validatedDraft.displayName,
          versionLabel: existing.versionLabel,
          createdAt: existing.createdAt,
          updatedAt: validatedDraft.updatedAt,
          saveKind: "manual_save",
          authoringDraft: validatedDraft,
          sourceProvenance: validatedDraft.sourceProvenance,
          syntheticDataOnly: true
        })
      );
      records.set(record.savedPlanId, cloneSavedRecord(record));
      persist();
      recordSavedRecordTraceStage("savedRecordPayload", record);
      return cloneSavedRecord(record);
    },
    saveAsDraft(draft, options) {
      const validatedDraft = validateAuthoringDraftContract({
        ...draft,
        displayName: options.displayName,
        versionLabel: options.versionLabel
      });
      const record = webRecordFromContract(
        validateSavedPlanRecordContract({
          savedPlanId: nextSavedPlanId(validatedDraft.sourceDefaultPlanId, nextSequence++),
          sourceDefaultPlanId: validatedDraft.sourceDefaultPlanId,
          planId: validatedDraft.planId,
          displayName: options.displayName,
          versionLabel: options.versionLabel,
          createdAt: validatedDraft.createdAt,
          updatedAt: validatedDraft.updatedAt,
          saveKind: "save_as",
          authoringDraft: validatedDraft,
          sourceProvenance: validatedDraft.sourceProvenance,
          syntheticDataOnly: true
        })
      );
      records.set(record.savedPlanId, cloneSavedRecord(record));
      persist();
      recordSavedRecordTraceStage("savedRecordPayload", record);
      return cloneSavedRecord(record);
    },
    load(recordId) {
      const record = records.get(recordId);
      return record == null ? null : cloneSavedRecord(record);
    },
    delete(recordId) {
      const deleted = records.delete(recordId);
      if (deleted) {
        persist();
      }
      return deleted;
    }
  };
}

export function createSavedRecord(
  copy: EditableFloorplanCopy,
  options: { savedPlanId?: string; saveKind?: SaveKind; versionLabel?: string } = {}
): SavedFloorplanRecord {
  assertNoForbiddenPayload(copy, "copy");
  const plan = validatePlanContract(copy.plan);
  if (copy.readOnly !== false) {
    throw new Error("saved floorplan copies must be editable");
  }
  if (!copy.parentDefaultPlanId) {
    throw new Error("saved floorplan copies require parentDefaultPlanId");
  }
  const sourceProvenance = createSafeSourceProvenance({
    sourceReferenceId: copy.parentDefaultPlanId,
    sourceKind: "default_fixture",
    notes: ["Saved editable JSON copy; private source payload is not persisted."]
  });
  const authoringDraft = validateAuthoringDraftContract({
    draftId: `draft-${options.savedPlanId ?? plan.planId}`,
    sourceDefaultPlanId: copy.parentDefaultPlanId,
    planId: plan.planId,
    displayName: plan.name,
    versionLabel: options.versionLabel ?? "v1",
    editableLayout: planContractToEditableLayoutGeometry(plan),
    sourcePlan: plan,
    authoringStatus: "draft_valid",
    pathSyncStatus: "fresh",
    authoringWarnings: [],
    sourceProvenance,
    createdAt: copy.createdAt,
    updatedAt: copy.updatedAt,
    syntheticDataOnly: true
  });

  const record = webRecordFromContract(
    validateSavedPlanRecordContract({
      savedPlanId: options.savedPlanId ?? `saved-${plan.planId}`,
      sourceDefaultPlanId: copy.parentDefaultPlanId,
      planId: plan.planId,
      displayName: plan.name,
      versionLabel: options.versionLabel ?? "v1",
      createdAt: copy.createdAt,
      updatedAt: copy.updatedAt,
      saveKind: options.saveKind ?? "default_duplicate",
      authoringDraft,
      sourceProvenance,
      syntheticDataOnly: true
    })
  );
  assertNoForbiddenPayload(record, "record");
  return record;
}

function cloneSavedRecord(record: SavedFloorplanRecord): SavedFloorplanRecord {
  return {
    ...record,
    authoringDraft: validateAuthoringDraftContract(JSON.parse(JSON.stringify(record.authoringDraft))),
    sourceProvenance: { ...record.sourceProvenance, notes: [...record.sourceProvenance.notes] },
    plan: clonePlan(record.plan)
  };
}

function clonePlan(plan: PlanContract): PlanContract {
  return JSON.parse(JSON.stringify(plan)) as PlanContract;
}

function assertNoForbiddenPayload(value: unknown, label: string): void {
  if (value == null || typeof value !== "object") {
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_SAVED_PAYLOAD_KEYS.includes(key)) {
      throw new Error(`${label}.${key} is not allowed in saved floorplan records`);
    }
    assertNoForbiddenPayload(child, `${label}.${key}`);
  }
}

function webRecordFromContract(record: SavedPlanRecordContract): SavedFloorplanRecord {
  const plan = validatePlanContract({
    ...buildPlanContractFromEditableLayout({
      sourcePlan: record.authoringDraft.sourcePlan,
      editableLayout: record.authoringDraft.editableLayout,
      planId: record.planId
    }),
    name: record.displayName
  });
  return {
    ...record,
    recordId: record.savedPlanId,
    readOnly: false,
    parentDefaultPlanId: record.sourceDefaultPlanId,
    plan: clonePlan(plan)
  };
}

function savedRecordToContract(record: SavedFloorplanRecord): SavedPlanRecordContract {
  return validateSavedPlanRecordContract({
    savedPlanId: record.savedPlanId,
    sourceDefaultPlanId: record.sourceDefaultPlanId,
    planId: record.planId,
    displayName: record.displayName,
    versionLabel: record.versionLabel,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    saveKind: record.saveKind,
    authoringDraft: record.authoringDraft,
    sourceProvenance: record.sourceProvenance,
    syntheticDataOnly: true
  });
}

function nextSavedPlanId(sourceDefaultPlanId: string, sequence: number): string {
  return `saved-${sourceDefaultPlanId}-${String(sequence).padStart(3, "0")}`;
}
