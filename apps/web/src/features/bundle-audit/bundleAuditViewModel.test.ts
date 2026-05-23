import { createBundleAuditProofViewModel } from "./bundleAuditViewModel";
import {
  phase9BundleAuditInvalidJsonText,
  phase9BundleAuditValidJsonText
} from "../../fixtures/phase9BundleAuditProof";

const viewModel = createBundleAuditProofViewModel({
  validJsonText: phase9BundleAuditValidJsonText,
  invalidJsonText: phase9BundleAuditInvalidJsonText
});

if (viewModel.localProofLabel !== "Local proof only") {
  throw new Error("local proof language missing");
}

if (!viewModel.validAudit.ok || viewModel.validAudit.statusLabel !== "Audit passed") {
  throw new Error("valid audit status missing");
}

if (viewModel.validAudit.exportId !== "report-export-bundle-basic") {
  throw new Error("valid audit exportId missing");
}

if (!/^[0-9a-f]{64}$/.test(viewModel.validAudit.hash)) {
  throw new Error("hash missing");
}

if (viewModel.validAudit.reviewSteps.length === 0) {
  throw new Error("review steps missing");
}

if (viewModel.validAudit.reportCount !== 2) {
  throw new Error("summary missing");
}

if (viewModel.validAudit.limitations.length === 0) {
  throw new Error("limitations missing");
}

if (viewModel.invalidAudit.ok) {
  throw new Error("invalid JSON failure path missing");
}

if (!viewModel.invalidAudit.failureMessage.includes("JSON parse failed locally")) {
  throw new Error("invalid JSON parse failure missing");
}
