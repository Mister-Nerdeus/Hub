import {
  validatePlanContract,
  type EditableFloorplanCopy,
  type PlanContract
} from "@nerdeus/shared";

export type SavedFloorplanRecord = {
  recordId: string;
  readOnly: false;
  parentDefaultPlanId: string;
  createdAt: string;
  updatedAt: string;
  plan: PlanContract;
};

export type SavedFloorplanStore = {
  list(): SavedFloorplanRecord[];
  save(copy: EditableFloorplanCopy): SavedFloorplanRecord;
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
  `source${"Filename"}`
];

export function createSavedFloorplanStore(): SavedFloorplanStore {
  const records = new Map<string, SavedFloorplanRecord>();

  return {
    list() {
      return [...records.values()].map(cloneSavedRecord).sort((left, right) =>
        left.recordId.localeCompare(right.recordId)
      );
    },
    save(copy) {
      const record = createSavedRecord(copy);
      records.set(record.recordId, cloneSavedRecord(record));
      return cloneSavedRecord(record);
    },
    load(recordId) {
      const record = records.get(recordId);
      return record == null ? null : cloneSavedRecord(record);
    },
    delete(recordId) {
      return records.delete(recordId);
    }
  };
}

export function createSavedRecord(copy: EditableFloorplanCopy): SavedFloorplanRecord {
  assertNoForbiddenPayload(copy, "copy");
  const plan = validatePlanContract(copy.plan);
  if (copy.readOnly !== false) {
    throw new Error("saved floorplan copies must be editable");
  }
  if (!copy.parentDefaultPlanId) {
    throw new Error("saved floorplan copies require parentDefaultPlanId");
  }

  const record: SavedFloorplanRecord = {
    recordId: `saved-${plan.planId}`,
    readOnly: false,
    parentDefaultPlanId: copy.parentDefaultPlanId,
    createdAt: copy.createdAt,
    updatedAt: copy.updatedAt,
    plan: clonePlan(plan)
  };
  assertNoForbiddenPayload(record, "record");
  return record;
}

function cloneSavedRecord(record: SavedFloorplanRecord): SavedFloorplanRecord {
  return {
    ...record,
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
