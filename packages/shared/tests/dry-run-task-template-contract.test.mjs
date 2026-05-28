import assert from "node:assert/strict";
import test from "node:test";

import {
  dryRunTaskTemplates,
  validateDryRunTaskTemplateSet
} from "../dist/index.js";

test("dry-run task templates validate as synthetic placeholders", () => {
  const templates = validateDryRunTaskTemplateSet(dryRunTaskTemplates);

  assert.equal(templates.length, 5);
  assert.deepEqual(
    templates.map((template) => template.category),
    [
      "room_check",
      "documentation_placeholder",
      "support_coordination_placeholder",
      "turnover_placeholder",
      "observation_placeholder"
    ]
  );
  assert.ok(templates.every((template) => template.syntheticOperationalPlaceholder));
});

test("dry-run task templates have bounded duration and intensity", () => {
  const templates = validateDryRunTaskTemplateSet(dryRunTaskTemplates);

  assert.ok(
    templates.every(
      (template) =>
        template.durationBand.minMinutes > 0 &&
        template.durationBand.maxMinutes >= template.durationBand.minMinutes &&
        template.durationBand.maxMinutes <= 60
    )
  );
  assert.ok(templates.every((template) => ["low", "medium", "high"].includes(template.intensityBand)));
});

test("dry-run task templates reject medication and diagnosis text", () => {
  const template = { ...dryRunTaskTemplates[0], templateId: "dry-run-medication-placeholder" };

  assert.throws(() => validateDryRunTaskTemplateSet([template]), /medication/);
  assert.throws(
    () =>
      validateDryRunTaskTemplateSet([
        { ...dryRunTaskTemplates[0], templateId: "dry-run-diagnosis-placeholder" }
      ]),
    /diagnosis/
  );
});

test("dry-run task templates reject clinical order, protocol, or outcome claim flags", () => {
  assert.throws(
    () =>
      validateDryRunTaskTemplateSet([
        { ...dryRunTaskTemplates[0], templateId: "dry-run-order-placeholder" }
      ]),
    /order/
  );
  assert.throws(
    () =>
      validateDryRunTaskTemplateSet([
        { ...dryRunTaskTemplates[0], templateId: "dry-run-protocol-placeholder" }
      ]),
    /protocol/
  );
  assert.throws(
    () => validateDryRunTaskTemplateSet([{ ...dryRunTaskTemplates[0], clinicalClaim: true }]),
    /clinicalClaim/
  );
  assert.throws(
    () =>
      validateDryRunTaskTemplateSet([{ ...dryRunTaskTemplates[0], outcomePredictionClaim: true }]),
    /outcomePredictionClaim/
  );
});
