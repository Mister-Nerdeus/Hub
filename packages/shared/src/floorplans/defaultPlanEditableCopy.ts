import {
  duplicateDefaultPlan
} from "../default-plans/duplicateDefaultPlan.js";
import type { DefaultSavedPlanFixtureContract } from "../default-plans/defaultSavedPlanFixtureContract.js";
import {
  createSafeSourceProvenance,
  validateAuthoringDraftContract,
  type AuthoringDraftContract,
  type SourceProvenance
} from "./authoringDraftContract.js";
import { validateEditableLayoutGeometryContract } from "../layout-editor/editableLayoutGeometryContract.js";

export type DefaultPlanEditableCopyContract = {
  sourceDefaultPlanId: string;
  editablePlanId: string;
  displayName: string;
  versionLabel: string;
  sourceProvenance: SourceProvenance;
  createdFromDefaultAt: string;
  authoringDraft: AuthoringDraftContract;
  syntheticDataOnly: true;
};

export type CreateDefaultPlanEditableCopyInput = {
  defaultFixture: DefaultSavedPlanFixtureContract;
  editablePlanId: string;
  displayName: string;
  versionLabel: string;
  createdAt: string;
  editableLayout: unknown;
};

export function createDefaultPlanEditableCopy({
  defaultFixture,
  editablePlanId,
  displayName,
  versionLabel,
  createdAt,
  editableLayout
}: CreateDefaultPlanEditableCopyInput): DefaultPlanEditableCopyContract {
  const copy = duplicateDefaultPlan(defaultFixture, {
    planId: editablePlanId,
    name: displayName,
    createdAt
  });
  const sourceProvenance = createSafeSourceProvenance({
    sourceReferenceId: defaultFixture.sourcePlanId,
    sourceKind: "private_docx_reference",
    notes: [
      "Private source reference may guide manual authoring.",
      "No source binary, image payload, or private path is stored."
    ]
  });
  const authoringDraft = validateAuthoringDraftContract({
    draftId: `draft-${editablePlanId}`,
    sourceDefaultPlanId: defaultFixture.plan.planId,
    planId: copy.plan.planId,
    displayName: copy.plan.name,
    versionLabel,
    editableLayout: validateEditableLayoutGeometryContract(editableLayout),
    sourcePlan: copy.plan,
    authoringStatus: "draft_valid",
    pathSyncStatus: "fresh",
    authoringWarnings: [],
    sourceProvenance,
    createdAt,
    updatedAt: createdAt,
    syntheticDataOnly: true
  });
  return {
    sourceDefaultPlanId: defaultFixture.plan.planId,
    editablePlanId,
    displayName,
    versionLabel,
    sourceProvenance,
    createdFromDefaultAt: createdAt,
    authoringDraft,
    syntheticDataOnly: true
  };
}
