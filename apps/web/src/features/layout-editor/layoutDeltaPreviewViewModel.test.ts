import type { LayoutEditAuditEntry } from "./layoutEditAuditTrail";
import { buildLayoutDeltaPreviewViewModel } from "./layoutDeltaPreviewViewModel";

const assert = {
  equal<T>(actual: T, expected: T): void {
    if (actual !== expected) {
      throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
    }
  },
  deepEqual(actual: unknown, expected: unknown): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(actual)} to deep equal ${JSON.stringify(expected)}`);
    }
  }
};

const cleanViewModel = buildLayoutDeltaPreviewViewModel({
  isDirty: false,
  editAuditTrail: []
});
assert.deepEqual(cleanViewModel, {
  status: "current",
  title: "Metric deltas",
  message: "No pending layout metric recalculation.",
  rerunWired: false,
  hasFakeMetricValues: false,
  affectedCategories: []
});

const auditEntry: LayoutEditAuditEntry = {
  editId: "layout-edit-000001",
  editType: "move_room",
  objectType: "room",
  objectId: "room-01",
  before: { xFeet: 0, yFeet: 0 },
  after: { xFeet: 8, yFeet: -2 },
  deltaFeet: { deltaXFeet: 8, deltaYFeet: -2 },
  createdAtOrder: 1,
  limitations: ["Audit entry describes an operational layout edit only."]
};

const pendingViewModel = buildLayoutDeltaPreviewViewModel({
  isDirty: true,
  editAuditTrail: [auditEntry]
});
assert.equal(pendingViewModel.status, "pending_recalculation");
assert.equal(pendingViewModel.rerunWired, false);
assert.equal(pendingViewModel.hasFakeMetricValues, false);
assert.deepEqual(pendingViewModel.affectedCategories, [
  "walk time",
  "layout friction",
  "room turnover",
  "patient wait/idle proxy",
  "nurse strain proxy"
]);
assert.equal(pendingViewModel.latestEditId, "layout-edit-000001");

const resizeAuditEntry: LayoutEditAuditEntry = {
  editId: "layout-edit-000002",
  editType: "resize_room",
  objectType: "room",
  objectId: "room-01",
  resizeHandle: "east",
  before: { xFeet: 0, yFeet: 0, widthFeet: 12, heightFeet: 10 },
  after: { xFeet: 0, yFeet: 0, widthFeet: 14, heightFeet: 10 },
  deltaFeet: { deltaXFeet: 0, deltaYFeet: 0, deltaWidthFeet: 2, deltaHeightFeet: 0 },
  createdAtOrder: 2,
  limitations: ["Audit entry describes an operational layout edit only."]
};

const inspectorDimensionAuditEntry: LayoutEditAuditEntry = {
  editId: "layout-edit-000003",
  editType: "edit_room_dimensions",
  objectType: "room",
  objectId: "room-01",
  before: { xFeet: 0, yFeet: 0, widthFeet: 12, heightFeet: 10 },
  after: { xFeet: 1, yFeet: 0, widthFeet: 14, heightFeet: 10 },
  deltaFeet: { deltaXFeet: 1, deltaYFeet: 0, deltaWidthFeet: 2, deltaHeightFeet: 0 },
  changedFields: ["widthFeet", "xFeet"],
  createdAtOrder: 3,
  limitations: ["Audit entry describes an operational layout edit only."]
};

assert.equal(
  buildLayoutDeltaPreviewViewModel({
    isDirty: true,
    editAuditTrail: [auditEntry, resizeAuditEntry, inspectorDimensionAuditEntry]
  }).latestEditId,
  "layout-edit-000003"
);
