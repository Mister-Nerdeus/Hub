import snapshotJson from "./planBuilderReviewFlowSnapshot.json";

export type PlanBuilderReviewFlowSnapshot = typeof snapshotJson;
export type PlanBuilderReviewFlowSnapshotPlan = PlanBuilderReviewFlowSnapshot["plans"][number];

export const planBuilderReviewFlowSnapshot: PlanBuilderReviewFlowSnapshot = snapshotJson;
