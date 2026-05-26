import {
  buildPlanContractFromEditableLayout,
  validateAuthoringDraftContract,
  type AuthoringDraftContract,
  type PlanContract
} from "@nerdeus/shared";

import plan2RouteRepairedSavedCopy from "../../../../packages/shared/fixtures/source-corrections/plan-2/plan-2-route-repaired-saved-copy.json" with { type: "json" };
import plan3RouteRepairedSavedCopy from "../../../../packages/shared/fixtures/source-corrections/plan-3/plan-3-route-repaired-saved-copy.json" with { type: "json" };
import plan4RouteRepairedSavedCopy from "../../../../packages/shared/fixtures/source-corrections/plan-4/plan-4-route-repaired-saved-copy.json" with { type: "json" };
import plan5RouteRepairedSavedCopy from "../../../../packages/shared/fixtures/source-corrections/plan-5/plan-5-route-repaired-saved-copy.json" with { type: "json" };

export type ReviewCandidatePlanId = "plan-2" | "plan-3" | "plan-4" | "plan-5";

export type ReviewCandidateFloorplanFixture = {
  candidateId: ReviewCandidatePlanId;
  savedPlanId: string;
  sourceDefaultPlanId: string;
  planId: string;
  displayName: string;
  versionLabel: string;
  authoringDraft: AuthoringDraftContract;
  plan: PlanContract;
  syntheticDataOnly: true;
};

const routeRepairedSavedCopies = [
  ["plan-2", plan2RouteRepairedSavedCopy],
  ["plan-3", plan3RouteRepairedSavedCopy],
  ["plan-4", plan4RouteRepairedSavedCopy],
  ["plan-5", plan5RouteRepairedSavedCopy]
] as const;

export const reviewCandidateFloorplanFixtures: ReviewCandidateFloorplanFixture[] =
  routeRepairedSavedCopies.map(([candidateId, savedCopy]) =>
    createReviewCandidateFloorplanFixture(candidateId, savedCopy)
  );

export function findReviewCandidateFloorplan(
  candidateId: string
): ReviewCandidateFloorplanFixture | null {
  return reviewCandidateFloorplanFixtures.find((fixture) => fixture.candidateId === candidateId) ?? null;
}

function createReviewCandidateFloorplanFixture(
  candidateId: ReviewCandidatePlanId,
  savedCopy: unknown
): ReviewCandidateFloorplanFixture {
  const record = requireRecord(savedCopy);
  const authoringDraft = validateAuthoringDraftContract(record.authoringDraft);
  const plan = buildPlanContractFromEditableLayout({
    sourcePlan: authoringDraft.sourcePlan,
    editableLayout: authoringDraft.editableLayout,
    planId: authoringDraft.planId
  });

  if (record.syntheticDataOnly !== true) {
    throw new Error(`${candidateId} review candidate must remain synthetic-only`);
  }

  return {
    candidateId,
    savedPlanId: requireString(record.savedPlanId, `${candidateId}.savedPlanId`),
    sourceDefaultPlanId: requireString(record.sourceDefaultPlanId, `${candidateId}.sourceDefaultPlanId`),
    planId: authoringDraft.planId,
    displayName: authoringDraft.displayName,
    versionLabel: authoringDraft.versionLabel,
    authoringDraft,
    plan,
    syntheticDataOnly: true
  };
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("review candidate saved copy must be an object");
  }
  return value as Record<string, unknown>;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}
