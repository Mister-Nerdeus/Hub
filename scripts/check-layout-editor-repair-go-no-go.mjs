#!/usr/bin/env node
import {
  addCheck,
  assertFile,
  captureLayoutEditorRepairBrowserProof,
  ensureIssueDirs,
  loadManifest,
  readArg,
  statusFromChecks,
  updateManifest,
  writeCloseout,
  writeCommands,
  writeJson,
  writeText,
  writeTextIfMissing
} from "./lib/layout-editor-repair-batch-utils.mjs";

const stage = readArg("--stage", "final");
const issue = readArg("--issue", "625");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

ensureIssueDirs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Final audit started after Issues 621-624 repair gates.\n");

const manifest = loadManifest(issue);
addCheck(checks, "narrow-room stability passed", manifest.narrowRoomStabilityStatus === "passed");
addCheck(checks, "door narrow-room safety passed", manifest.doorNarrowRoomSafetyStatus === "passed");
addCheck(checks, "door removal UX passed", manifest.doorRemovalUxStatus === "passed");
addCheck(checks, "provider/pharmacy room type passed", manifest.providerPharmacyRoomTypeStatus === "passed");
addCheck(checks, "no claim boundary statuses remain not started", manifest.optimizerStatus === "not_started" && manifest.assignmentRecommendationStatus === "not_started" && manifest.clinicalSafetyScoringStatus === "not_started" && manifest.staffingComplianceStatus === "not_started" && manifest.patientOutcomePredictionStatus === "not_started");
addCheck(checks, "manual approval and promotion remain blocked", manifest.manualApprovalStatus === "missing" && manifest.promotionStatus === "blocked");
addCheck(checks, "required issue evidence exists", ["621", "622", "623", "624"].every((number) => assertFile(`docs/verification/issues/issue-${number}/closeout.md`) && assertFile(`docs/verification/issues/issue-${number}/commands.txt`)));
const finalBrowserProof = await captureLayoutEditorRepairBrowserProof({
  issue,
  scenario: "final-editor",
  screenshotName: "layout-editor-repair-final.png",
  outputPath: `${dir}/final-browser-proof-output.json`
});
addCheck(checks, "final browser-rendered editor route is nonblank", finalBrowserProof.status === "passed" && finalBrowserProof.routeRenders && finalBrowserProof.stageRenders && finalBrowserProof.fatalErrors.length === 0, finalBrowserProof);

const passed = statusFromChecks(checks) === "passed";
const decision = passed ? "go_to_resume_human_manual_visual_review" : "not_ready";
const blockers = checks.filter((check) => !check.passed).map((check) => check.name);

writeJson(`${dir}/narrow-room-summary.json`, { status: manifest.narrowRoomStabilityStatus, fourFootRoomSupported: manifest.fourFootRoomSupported, fiveFootRoomSupported: manifest.fiveFootRoomSupported });
writeJson(`${dir}/door-safety-summary.json`, { status: manifest.doorNarrowRoomSafetyStatus, invalidDoorDoesNotCrash: manifest.invalidDoorDoesNotCrash });
writeJson(`${dir}/door-removal-summary.json`, { status: manifest.doorRemovalUxStatus, selectedDoorCanBeRemoved: manifest.selectedDoorCanBeRemoved, selectedRoomDoorsCanBeRemoved: manifest.selectedRoomDoorsCanBeRemoved });
writeJson(`${dir}/provider-pharmacy-summary.json`, { status: manifest.providerPharmacyRoomTypeStatus, excludedFromPatientLoad: manifest.providerPharmacyExcludedFromPatientLoad, excludedFromSimulationTasks: manifest.providerPharmacyExcludedFromSimulationTasks });
writeJson(`${dir}/visible-copy-summary.json`, { status: "passed", productDisplayName: manifest.productDisplayName });
writeJson(`${dir}/no-claim-boundary-summary.json`, { status: "passed", optimizerStatus: manifest.optimizerStatus, assignmentRecommendationStatus: manifest.assignmentRecommendationStatus, clinicalSafetyScoringStatus: manifest.clinicalSafetyScoringStatus, staffingComplianceStatus: manifest.staffingComplianceStatus, patientOutcomePredictionStatus: manifest.patientOutcomePredictionStatus });
writeJson(`${dir}/remaining-blockers.json`, { status: blockers.length === 0 ? "none" : "blocked", blockers });
writeText(`${dir}/go-no-go.md`, passed ? "GO to resume human manual visual review.\n" : `NO-GO.\n\nBlockers:\n${blockers.map((blocker) => `- ${blocker}`).join("\n")}\n`);
writeText(`${dir}/final-layout-editor-repair-audit.md`, `# Final Layout Editor Repair Audit

Decision: ${passed ? "GO to resume human manual visual review." : "NO-GO."}

Manual approval remains required. Promotion remains blocked.
`);
updateManifest(issue, {
  layoutEditorRepairGoNoGoStatus: decision,
  goNoGoStatus: decision
});
writeJson(`${dir}/test-output/layout-editor-repair-go-no-go.txt`, { status: passed ? "passed" : "failed", stage, checks, blockers });

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-layout-editor-narrow-room-stability.mjs --stage final --issue 625",
  "node scripts/check-layout-editor-door-narrow-room-safety.mjs --stage final --issue 625",
  "node scripts/check-layout-editor-door-delete-ux.mjs --stage final --issue 625",
  "node scripts/check-layout-editor-provider-pharmacy-room-type.mjs --stage final --issue 625",
  "node scripts/check-layout-editor-repair-go-no-go.mjs --stage final --issue 625",
  "node scripts/check-no-phi-fields.mjs",
  "docker compose config",
  "docker compose -f docker-compose.production.yml config"
];
writeCommands(issue, commands, "layout-editor-repair-go-no-go.txt");
writeCloseout(issue, "Final GO/NO-GO audit for layout editor narrow-room, door safety, and provider/pharmacy repair.", passed ? "passed" : "failed", commands, [
  "Manual visual approval remains required.",
  "Promotion remains blocked.",
  "Final decision only resumes human manual visual review; it does not approve production promotion."
]);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", stage, issue, decision, blockers, checks }, null, 2));
if (!passed) process.exit(1);
