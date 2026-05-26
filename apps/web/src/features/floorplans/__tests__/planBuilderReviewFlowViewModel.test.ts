// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { mkdirSync, writeFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import { planBuilderReviewFlowSnapshot } from "../generated/planBuilderReviewFlowSnapshot";
import {
  createPlanBuilderReviewFlowPlanViewModel,
  createPlanBuilderReviewFlowViewModel
} from "../planBuilderReviewFlowViewModel";
import type { PlanBuilderReviewFlowPlanSnapshot } from "../planBuilderReviewFlowTypes";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const evidenceDir = resolve(repoRoot, "docs/verification/issues/issue-333");

function writeEvidence(name: string, payload: unknown) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(resolve(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

const viewModel = createPlanBuilderReviewFlowViewModel();
const basePlan = planBuilderReviewFlowSnapshot.plans[0] as PlanBuilderReviewFlowPlanSnapshot;

if (viewModel.routeExportReadinessIsApproval !== false) {
  throw new Error("route/export readiness must never be treated as approval");
}

if (viewModel.simulationReadinessIsPromotionReadiness !== false) {
  throw new Error("simulation readiness must never be treated as promotion readiness");
}

if (!viewModel.manualReviewRequired || !viewModel.promotionBlocked) {
  throw new Error("review flow must require manual review and keep promotion blocked");
}

for (const plan of viewModel.plans) {
  if (!plan.routeReady || !plan.simulationReady) {
    throw new Error(`${plan.planId} should expose ready route/export status`);
  }
  if (!plan.manualReviewRequired || plan.manualReviewApproved) {
    throw new Error(`${plan.planId} must still require human review`);
  }
  if (!plan.promotionBlocked || plan.canPromote !== false) {
    throw new Error(`${plan.planId} promotion must remain disabled`);
  }
}

const routeReadyPlan = createPlanBuilderReviewFlowPlanViewModel({
  ...basePlan,
  routeReadinessStatus: "ready",
  simulationReadyExportStatus: "simulation_ready",
  manualReviewStatus: "manual_review_required",
  reviewerDecisionSource: "none",
  sampleRecordCountsAsApproval: false
});
if (routeReadyPlan.manualReviewApproved || routeReadyPlan.canPromote !== false) {
  throw new Error("route and simulation readiness must not imply review or promotion readiness");
}

const samplePlan = createPlanBuilderReviewFlowPlanViewModel({
  ...basePlan,
  manualReviewStatus: "approved_for_promotion_review",
  reviewerDecisionSource: "explicit_manual_artifact",
  sampleRecordCountsAsApproval: true
});
if (samplePlan.manualReviewApproved || samplePlan.sampleRecordCountsAsApproval !== false) {
  throw new Error("sample records must not count as review approval");
}

writeEvidence("review-flow-view-model-output.json", {
  issue: "333",
  status: "passed",
  reviewFlowId: viewModel.reviewFlowId,
  planCount: viewModel.plans.length,
  manualReviewRequired: viewModel.manualReviewRequired,
  promotionBlocked: viewModel.promotionBlocked
});

writeEvidence("route-ready-not-approved-negative-output.json", {
  issue: "333",
  status: "passed",
  routeReady: routeReadyPlan.routeReady,
  simulationReady: routeReadyPlan.simulationReady,
  manualReviewApproved: routeReadyPlan.manualReviewApproved,
  canPromote: routeReadyPlan.canPromote
});

writeEvidence("simulation-ready-not-promotion-ready-negative-output.json", {
  issue: "333",
  status: "passed",
  simulationReady: routeReadyPlan.simulationReady,
  promotionBlocked: routeReadyPlan.promotionBlocked,
  canPromote: routeReadyPlan.canPromote
});

writeEvidence("sample-record-negative-output.json", {
  issue: "333",
  status: "passed",
  sampleRecordCountsAsApproval: samplePlan.sampleRecordCountsAsApproval,
  manualReviewApproved: samplePlan.manualReviewApproved
});

writeEvidence("promotion-disabled-output.json", {
  issue: "333",
  status: "passed",
  canPromoteValues: viewModel.plans.map((plan) => [plan.planId, plan.canPromote])
});
