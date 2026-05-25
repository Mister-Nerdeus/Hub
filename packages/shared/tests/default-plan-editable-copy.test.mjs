import { createDefaultPlanEditableCopy } from "../dist/index.js";
import { testEditableLayout, testPlan } from "./authoring-test-helpers.mjs";

const defaultFixture = {
  schemaVersion: "1.0.0",
  defaultPlanRecordId: "default-plan-1",
  sourcePlanId: "source-plan-1",
  mappingId: "mapping-er-layout-plan-1",
  readOnly: true,
  importStatus: "validated_default",
  auditStatus: "validated_default",
  plan: {
    ...testPlan,
    planId: "default-er-layout-plan-1",
    name: "Default ER Layout Plan 1"
  },
  limitations: ["Synthetic operational default fixture."]
};

const copy = createDefaultPlanEditableCopy({
  defaultFixture,
  editablePlanId: "editable-default-er-layout-plan-1-v1",
  displayName: "Default ER Layout Plan 1 Authoring Copy",
  versionLabel: "v1",
  createdAt: "2026-05-25T00:00:00Z",
  editableLayout: {
    ...testEditableLayout,
    layoutId: "editable-default-er-layout-plan-1-v1"
  }
});

if (copy.sourceDefaultPlanId !== "default-er-layout-plan-1") {
  throw new Error("editable copy must preserve parent default plan relationship");
}
if (copy.sourceProvenance.publicExposureAllowed) {
  throw new Error("private source provenance must not be public");
}
if (copy.authoringDraft.syntheticDataOnly !== true) {
  throw new Error("editable copy must remain synthetic-data-only");
}
