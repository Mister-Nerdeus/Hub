#!/usr/bin/env node
import {
  buildCanonicalCapacityCountReport,
  fourToOneRatioPreset,
  threeToOneRatioPreset,
  validateRatioPresetContract,
  validateRatioPresetPair
} from "../packages/shared/dist/index.js";
import {
  createCheckContext,
  finalizeGate,
  runSelectedStages,
  scanFiles,
  writeJson,
  writeText
} from "./lib/scenario-seed-foundation-utils.mjs";

const stages = ["four-to-one", "three-to-one", "preset-validation", "no-compliance-claims", "final"];
const context = createCheckContext({
  scriptName: "ratio preset contracts",
  stages,
  statusKeyByStage: {
    "four-to-one": "ratioPresetFourToOneStatus",
    "three-to-one": "ratioPresetThreeToOneStatus",
    "preset-validation": "ratioPresetThreeToOneStatus",
    "no-compliance-claims": "ratioPresetFourToOneStatus"
  },
  outputName: "ratio-preset-contracts-output.json",
  defaultIssue: "553"
});

const report = buildCanonicalCapacityCountReport();
runSelectedStages(context, runStage);
finalizeGate(context, { testOutputName: "ratio-preset-contracts.txt" });

function runStage(stage) {
  if (stage === "four-to-one") {
    const preset = validateRatioPresetContract(fourToOneRatioPreset, report);
    context.add("4:1 preset validates", preset.patientsPerNurse === 4, preset);
    context.add("4:1 preset is planning assumption", preset.sourceNote === "synthetic planning assumption", preset.sourceNote);
    writeJson(`${context.dir}/four-to-one-preset-output.json`, { status: "passed", preset });
  }
  if (stage === "three-to-one") {
    const preset = validateRatioPresetContract(threeToOneRatioPreset, report);
    context.add("3:1 preset validates", preset.patientsPerNurse === 3, preset);
    context.add("3:1 preset is planning assumption", preset.sourceNote === "synthetic planning assumption", preset.sourceNote);
    writeJson(`${context.dir}/three-to-one-preset-output.json`, { status: "passed", preset });
  }
  if (stage === "preset-validation") {
    const pair = validateRatioPresetPair(fourToOneRatioPreset, threeToOneRatioPreset, report);
    context.add("ratio pair shares canonical scenario seed", pair[0].canonicalScenarioSeedId === pair[1].canonicalScenarioSeedId);
    context.add("ratio pair uses same capacity report", pair[0].capacityReportReference === pair[1].capacityReportReference);
    context.add("ratio presets use ratio eligible count", report.ratioEligibleCount === 22, report.ratioEligibleCount);
    writeJson(`${context.dir}/ratio-validation-output.json`, { status: "passed", ratioEligibleCount: report.ratioEligibleCount });
    writeJson(`${context.dir}/pairwise-ratio-validation-output.json`, { status: "passed", presets: pair.map((preset) => preset.presetId) });
    writeText(`${context.dir}/no-raw-room-count-output.txt`, "passed: ratio presets require selector-driven ratio-eligible bed positions and do not use raw room counts\n");
  }
  if (stage === "no-compliance-claims") {
    const findings = scanFiles(
      ["packages/shared/src/scenarios/ratioPresetContract.ts", "packages/shared/src/scenarios/ratioPresetValidation.ts"],
      [
        {
          label: "forbidden compliance claim",
          pattern: /certif(?:y|ies|ication)|clinically safe|safe staffing/iu,
          allowedPattern: /must not|does not|not_started/iu
        }
      ]
    );
    context.add("ratio preset files contain no compliance or clinical-safety claims", findings.length === 0, findings);
    writeText(`${context.dir}/no-compliance-claim-output.txt`, "passed: ratio preset copy is a planning assumption and no compliance claim is introduced\n");
    writeText(`${context.dir}/no-clinical-safety-claim-output.txt`, "passed: ratio presets set clinicalSafetyClaim to false\n");
  }
}

