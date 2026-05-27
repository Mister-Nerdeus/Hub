import { buildEditorNextStep } from "../editorNextStepViewModel";

function assertStep(
  actual: ReturnType<typeof buildEditorNextStep>,
  expectedStatus: ReturnType<typeof buildEditorNextStep>["status"],
  expectedPrimary: string
) {
  if (actual.status !== expectedStatus) {
    throw new Error(`Expected ${expectedStatus}, received ${actual.status}`);
  }
  if (actual.primaryStep !== expectedPrimary) {
    throw new Error(`Expected ${expectedPrimary}, received ${actual.primaryStep}`);
  }
}

assertStep(
  buildEditorNextStep({
    hasActiveFloorplan: false,
    selectedObjectType: null,
    editorMode: "edit",
    validationWarningCount: 0
  }),
  "no-floorplan",
  "Open a floorplan."
);

assertStep(
  buildEditorNextStep({
    hasActiveFloorplan: true,
    selectedObjectType: "room",
    editorMode: "edit",
    validationWarningCount: 0
  }),
  "room",
  "Edit room / add door / assign nurse."
);

assertStep(
  buildEditorNextStep({
    hasActiveFloorplan: true,
    selectedObjectType: "door",
    editorMode: "edit",
    validationWarningCount: 0
  }),
  "door",
  "Move / nudge / center / delete."
);

assertStep(
  buildEditorNextStep({
    hasActiveFloorplan: true,
    selectedObjectType: "room",
    editorMode: "presentation",
    validationWarningCount: 0
  }),
  "presentation",
  "Export screenshot."
);

assertStep(
  buildEditorNextStep({
    hasActiveFloorplan: true,
    selectedObjectType: "room",
    editorMode: "edit",
    validationWarningCount: 2
  }),
  "validation",
  "Open validation drawer."
);
