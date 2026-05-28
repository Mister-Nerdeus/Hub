#!/usr/bin/env node
import { createCheckContext, finalizeGate, runSelectedStages, writeJson, writeText } from "./lib/deterministic-dry-run-utils.mjs";

const stages = ["task-template-contract", "no-clinical-task-claims", "no-medication-or-diagnosis", "bounded-placeholders", "final"];
const context = createCheckContext({
  scriptName: "dry-run task template contract",
  stages,
  statusKeyByStage: {
    "task-template-contract": "taskTemplateContractStatus",
    "no-clinical-task-claims": "taskTemplateContractStatus",
    "no-medication-or-diagnosis": "taskTemplateContractStatus",
    "bounded-placeholders": "taskTemplateContractStatus"
  },
  outputName: "dry-run-task-template-contract-output.json",
  defaultIssue: "565"
});

await runSelectedStages(context, runStage);
finalizeGate(context, { testOutputName: "dry-run-task-template-contract.txt" });

async function runStage(stage) {
  const shared = await import("../packages/shared/dist/index.js");
  const templates = shared.validateDryRunTaskTemplateSet(shared.dryRunTaskTemplates);
  if (stage === "task-template-contract") {
    context.add("task template set validates", templates.length === 5, templates.map((template) => template.templateId));
    writeJson(`${context.dir}/task-template-contract-output.json`, { status: "passed", templates });
  }
  if (stage === "no-clinical-task-claims") {
    context.add("templates carry no clinical claim flag", templates.every((template) => template.clinicalClaim === false));
    writeText(`${context.dir}/no-clinical-task-claim-output.txt`, "passed: dry-run task templates are synthetic operational placeholders only.\n");
  }
  if (stage === "no-medication-or-diagnosis") {
    context.add("templates contain no medication or diagnosis text", templates.every((template) => template.medicationOrDiagnosisText === false));
    writeText(`${context.dir}/no-medication-output.txt`, "passed: dry-run task templates include no medication names.\n");
    writeText(`${context.dir}/no-diagnosis-output.txt`, "passed: dry-run task templates include no diagnosis text.\n");
  }
  if (stage === "bounded-placeholders") {
    context.add("template durations are bounded", templates.every((template) => template.durationBand.minMinutes > 0 && template.durationBand.maxMinutes >= template.durationBand.minMinutes));
    context.add("template intensities are bounded", templates.every((template) => ["low", "medium", "high"].includes(template.intensityBand)));
    writeJson(`${context.dir}/bounded-placeholder-output.json`, { status: "passed", templateCount: templates.length });
  }
}
