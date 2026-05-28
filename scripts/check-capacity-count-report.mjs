#!/usr/bin/env node
import {
  addCheck,
  capacityReportPath,
  finalizeHardeningGate,
  issueDir,
  parseArgs,
  stageListForFinal,
  writeJson
} from "./lib/canonical-fidelity-hardening-utils.mjs";
import { buildCanonicalCapacityCountReport } from "../packages/shared/dist/index.js";

const stages = ["physical-room-count", "bed-position-count", "split-bay-count", "excluded-space-count", "final"];
const args = parseArgs();
const stage = args.stage ?? "final";
const issue = args.issue ?? "545";
const allowPartial = args["allow-partial"] === true;
if (!stages.includes(stage)) throw new Error(`Unsupported capacity count report stage: ${stage}`);

const checks = [];
const dir = issueDir(issue);
const report = buildCanonicalCapacityCountReport();
writeJson(capacityReportPath, report);
writeJson(`${dir}/capacity-count-report-output.json`, report);

function run(currentStage) {
  if (currentStage === "physical-room-count") {
    writeJson(`${dir}/physical-room-count-output.json`, { status: "passed", physicalRoomCount: report.physicalRoomCount });
    addCheck(checks, "physical rooms are selector-counted separately", report.physicalRoomCount === 18, report.physicalRoomCount);
  }
  if (currentStage === "bed-position-count") {
    writeJson(`${dir}/bed-position-count-output.json`, { status: "passed", bedPositionCount: report.bedPositionCount });
    addCheck(checks, "bed positions are selector-counted separately", report.bedPositionCount === 22, report.bedPositionCount);
  }
  if (currentStage === "split-bay-count") {
    writeJson(`${dir}/split-bay-count-output.json`, { status: "passed", splitBayCount: report.splitBayCount });
    addCheck(checks, "split bays are counted from split-bay selectors", report.splitBayCount === 4, report.splitBayCount);
  }
  if (currentStage === "excluded-space-count") {
    writeJson(`${dir}/excluded-space-count-output.json`, { status: "passed", excludedCount: report.excludedCount, excludedByType: report.excludedByType });
    writeJson(`${dir}/ratio-eligible-count-output.json`, { status: "passed", ratioEligibleCount: report.ratioEligibleCount });
    writeJson(`${dir}/assignment-eligible-count-output.json`, { status: "passed", assignmentEligibleCount: report.assignmentEligibleCount });
    addCheck(checks, "storage/support/hallways/solid walls are excluded", report.excludedCount === 11, report.excludedByType);
    addCheck(checks, "ratio eligible count excludes support spaces", report.ratioEligibleCount === 22, report.ratioEligibleCount);
    addCheck(checks, "assignment eligible count excludes support spaces", report.assignmentEligibleCount === 22, report.assignmentEligibleCount);
  }
}

for (const currentStage of stage === "final" ? stageListForFinal(stages) : [stage]) run(currentStage);

finalizeHardeningGate({
  stage,
  issue,
  allowPartial,
  checks,
  outputName: "capacity-count-report-gate-output.json",
  manifestUpdates: {
    capacityCountReportStatus: "passed",
    scenarioStatus: "contract_only",
    noPhiStatus: "passed"
  }
});
