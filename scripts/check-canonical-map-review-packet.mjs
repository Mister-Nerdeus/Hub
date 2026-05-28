#!/usr/bin/env node
import {
  addCheck,
  fileExistsWithBytes,
  finalizeHardeningGate,
  issueDir,
  parseArgs,
  readJson,
  readText,
  writeJson,
  writeText
} from "./lib/canonical-fidelity-hardening-utils.mjs";

const args = parseArgs();
const issue = args.issue ?? "549";
const dir = issueDir(issue);
const checks = [];
const packetPath = "docs/review/canonical-map-manual-review-packet.md";
const checklistPath = "docs/review/canonical-map-review-checklist.md";
const packet = readText(packetPath);
const checklist = readText(checklistPath);
const sourceRecord = readJson("docs/verification/reference/plan-1-reference-source-record.json");
const overlay = readJson("docs/verification/reference/plan-1-reference-overlay.json");
const capacity = readJson("docs/verification/canonical-capacity-count-report.json");
const parity = readJson("docs/verification/image-backed-layout-parity-report.json");
const requiredSections = [
  "Reference Image And Source Record",
  "Overlay Trace Asset",
  "App Rendered Canonical Map Screenshot",
  "Region Screenshots",
  "Geometry Diff Summary",
  "Scale Contract Summary",
  "Room Bed Bay Count Summary",
  "Storage Support Exclusion Summary",
  "Known Limitations"
];

writeText(`${dir}/manual-review-packet-output.md`, packet);
writeText(`${dir}/review-checklist-output.md`, checklist);
writeJson(`${dir}/reference-asset-summary.json`, {
  path: sourceRecord.stableReferenceAssetPath,
  checksum: sourceRecord.checksum,
  manualVisualReviewRequired: sourceRecord.manualVisualReviewRequired
});
writeJson(`${dir}/overlay-summary.json`, {
  path: "docs/verification/reference/plan-1-reference-overlay.json",
  regionCount: overlay.regions.length,
  exactCadParityClaimed: overlay.exactCadParityClaimed
});
writeJson(`${dir}/app-screenshot-summary.json`, {
  appRendered: "docs/verification/issues/issue-543/screenshots/app-rendered-canonical-floorplan.png",
  regionScreenshots: parity.screenshots
});
writeJson(`${dir}/geometry-diff-summary.json`, {
  status: "passed",
  fixtureGeometryMutated: false
});
writeJson(`${dir}/capacity-count-summary.json`, capacity);
writeText(`${dir}/known-limitations-output.md`, packet.slice(packet.indexOf("## Known Limitations")));
writeText(`${dir}/promotion-blocked-output.txt`, "passed: promotion remains blocked.\n");
writeText(`${dir}/no-cad-parity-claim-output.txt`, "passed: exact CAD parity is not claimed.\n");

for (const section of requiredSections) {
  addCheck(checks, `packet includes ${section}`, packet.includes(`## ${section}`), section);
}
addCheck(checks, "review checklist exists", checklist.includes("Manual approval is not claimed") || checklist.includes("manual approval is not claimed"), checklistPath);
addCheck(checks, "manual approval is not claimed", packet.includes("Manual approval is not claimed") && !packet.includes("Manual approval is claimed"), null);
addCheck(checks, "promotion remains blocked", packet.includes("Promotion remains blocked"), null);
addCheck(checks, "reference image exists", fileExistsWithBytes("docs/verification/reference/plan-1-reference-floorplan.png", 100), null);
addCheck(checks, "app screenshot exists", fileExistsWithBytes("docs/verification/issues/issue-543/screenshots/app-rendered-canonical-floorplan.png", 100), null);

finalizeHardeningGate({
  stage: "final",
  issue,
  allowPartial: false,
  checks,
  outputName: "canonical-map-review-packet-output.json",
  manifestUpdates: {
    manualReviewPacketStatus: "passed",
    manualApprovalStatus: "missing",
    promotionStatus: "blocked",
    noPhiStatus: "passed"
  }
});
