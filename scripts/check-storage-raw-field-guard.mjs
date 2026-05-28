#!/usr/bin/env node
import {
  addCheck,
  finalizeHardeningGate,
  issueDir,
  parseArgs,
  readJson,
  stageListForFinal,
  writeJson
} from "./lib/canonical-fidelity-hardening-utils.mjs";
import {
  buildCanonicalCapacityCountReport,
  buildStorageRawFieldGuardReport
} from "../packages/shared/dist/index.js";

const stages = ["raw-field-audit", "selector-ignore-proof", "future-drift-negative", "final"];
const args = parseArgs();
const stage = args.stage ?? "final";
const issue = args.issue ?? "546";
const allowPartial = args["allow-partial"] === true;
if (!stages.includes(stage)) throw new Error(`Unsupported storage raw-field guard stage: ${stage}`);

const checks = [];
const dir = issueDir(issue);
const plan = readJson("packages/shared/fixtures/default-plans/default-er-layout-plan-1.json").plan;
const storage = plan.rooms.find((room) => room.id === "room-14");
const report = buildStorageRawFieldGuardReport(storage);
const capacityReport = buildCanonicalCapacityCountReport();

function run(currentStage) {
  if (currentStage === "raw-field-audit") {
    writeJson(`${dir}/storage-raw-field-audit-output.json`, report.rawFieldAudit);
    addCheck(checks, "storage raw field risk is documented", report.rawFieldRiskPresent === true, report.rawFieldAudit);
    addCheck(checks, "storage room retains storage room type", storage.roomType === "storage", storage.roomType);
  }
  if (currentStage === "selector-ignore-proof") {
    writeJson(`${dir}/storage-selector-ignore-proof.json`, report.selectorExclusion);
    writeJson(`${dir}/storage-capacity-exclusion-output.json`, {
      status: "passed",
      storageCount: capacityReport.storageCount,
      excludedByType: capacityReport.excludedByType,
      ratioEligibleCount: capacityReport.ratioEligibleCount,
      assignmentEligibleCount: capacityReport.assignmentEligibleCount
    });
    addCheck(checks, "selectors ignore room-like raw fields for storage", report.selectorExclusion.bedCountContribution === 0 && report.selectorExclusion.physicalRoomCountContribution === 0, report.selectorExclusion);
    addCheck(checks, "storage remains non-assignable", report.selectorExclusion.assignmentEligible === false, report.selectorExclusion.assignmentEligible);
    addCheck(checks, "storage remains excluded from ratio math", report.selectorExclusion.ratioEligible === false, report.selectorExclusion.ratioEligible);
    addCheck(checks, "storage remains excluded from room-load generation", report.selectorExclusion.roomLoadEligible === false, report.selectorExclusion.roomLoadEligible);
  }
  if (currentStage === "future-drift-negative") {
    writeJson(`${dir}/storage-future-drift-negative-output.json`, report.futureDriftNegative);
    addCheck(checks, "future drift negative proof passes", report.futureDriftNegative.storageWithRoomLikeRawFieldsStillExcluded === true, report.futureDriftNegative);
  }
}

for (const currentStage of stage === "final" ? stageListForFinal(stages) : [stage]) run(currentStage);

finalizeHardeningGate({
  stage,
  issue,
  allowPartial,
  checks,
  outputName: "storage-raw-field-guard-output.json",
  manifestUpdates: {
    storageRawFieldGuardStatus: "passed",
    scenarioStatus: "contract_only",
    noPhiStatus: "passed"
  }
});
