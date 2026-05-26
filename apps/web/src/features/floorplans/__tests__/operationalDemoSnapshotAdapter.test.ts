import { createOperationalDemoDeveloperSnapshot, createOperationalDemoOperatorSnapshot } from "../operationalDemoSnapshotAdapter";

const operatorSnapshot = createOperationalDemoOperatorSnapshot();
if (operatorSnapshot.productDisplayName !== "ER Pod Shift Simulator") {
  throw new Error("operator snapshot product name must remain ER Pod Shift Simulator");
}
if (operatorSnapshot.operatorPlans.length !== 4) {
  throw new Error("operator snapshot must include Plans 2 through 5");
}
const operatorPayload = JSON.stringify(operatorSnapshot.operatorPlans);
if (/docs\/verification|docs\/manual-review|manual_review_required|simulation_ready|[a-f0-9]{64}/u.test(operatorPayload)) {
  throw new Error("operator snapshot must not expose raw proof details");
}

const developerSnapshot = createOperationalDemoDeveloperSnapshot();
if ((developerSnapshot.developerEvidence?.length ?? 0) !== 4) {
  throw new Error("developer snapshot must expose evidence for Plans 2 through 5");
}
