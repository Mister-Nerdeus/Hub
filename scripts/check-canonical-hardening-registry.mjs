#!/usr/bin/env node
import {
  addCheck,
  finalizeHardeningGate,
  issueDir,
  parseArgs,
  readJson,
  readText,
  stageListForFinal,
  writeJson
} from "./lib/canonical-fidelity-hardening-utils.mjs";

const stages = ["package-scripts", "canonical-registry", "verify-local", "final"];
const args = parseArgs();
const stage = args.stage ?? "final";
const issue = args.issue ?? "549";
const allowPartial = args["allow-partial"] === true;
if (!stages.includes(stage)) throw new Error(`Unsupported canonical hardening registry stage: ${stage}`);

const checks = [];
const dir = issueDir(issue);
const packageJson = readJson("package.json");
const verifyLocal = readText("scripts/verify-local.mjs");
const registryPath = "docs/verification/canonical-hardening-gate-registry.json";
const registry = readJson(registryPath);
const requiredScripts = [
  "check:reference-image-asset",
  "check:image-backed-layout-parity",
  "check:split-bay-fixture-bridge",
  "check:capacity-count-report",
  "check:storage-raw-field-guard",
  "check:editor-pan-threshold",
  "check:canonical-scenario-preflight"
];

function run(currentStage) {
  if (currentStage === "package-scripts") {
    const summary = Object.fromEntries(requiredScripts.map((script) => [script, packageJson.scripts[script] ?? null]));
    writeJson(`${dir}/package-script-hardening-output.json`, summary);
    addCheck(checks, "hardening gates are first-class package scripts", requiredScripts.every((script) => typeof packageJson.scripts[script] === "string"), summary);
  }
  if (currentStage === "canonical-registry") {
    const registryScripts = new Set(registry.gates.map((gate) => gate.packageScript));
    const registryFiles = registry.gates.map((gate) => gate.script);
    writeJson(`${dir}/canonical-hardening-registry-output.json`, {
      status: "passed",
      registryPath,
      requiredScripts,
      registryGateCount: registry.gates.length,
      registryFiles
    });
    addCheck(checks, "canonical hardening registry has expected batch", registry.batch === "541-550", registry.batch);
    addCheck(checks, "canonical hardening registry covers required gates", requiredScripts.every((script) => registryScripts.has(script)), { requiredScripts, registryScripts: [...registryScripts] });
    addCheck(checks, "canonical hardening registry references gate files", registryFiles.every((file) => file.startsWith("scripts/check-") && file.endsWith(".mjs")), registryFiles);
  }
  if (currentStage === "verify-local") {
    const summary = Object.fromEntries(requiredScripts.map((script) => [`npm run ${script}`, verifyLocal.includes(`npm run ${script}`)]));
    writeJson(`${dir}/verify-local-hardening-output.json`, summary);
    addCheck(checks, "verify-local includes hardening package scripts", Object.values(summary).every(Boolean), summary);
  }
}

for (const currentStage of stage === "final" ? stageListForFinal(stages) : [stage]) run(currentStage);

finalizeHardeningGate({
  stage,
  issue,
  allowPartial,
  checks,
  outputName: "canonical-hardening-registry-output.json",
  manifestUpdates: {
    canonicalHardeningGateStatus: "passed",
    noPhiStatus: "passed"
  }
});
