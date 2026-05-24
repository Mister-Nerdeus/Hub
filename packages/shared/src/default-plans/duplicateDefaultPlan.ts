import { validatePlanContract, type PlanContract } from "../contracts.js";
import {
  validateDefaultSavedPlanFixtureContract,
  type DefaultSavedPlanFixtureContract
} from "./defaultSavedPlanFixtureContract.js";

export type DuplicateDefaultPlanOptions = {
  planId: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export type EditableFloorplanCopy = {
  schemaVersion: "1.0.0";
  readOnly: false;
  parentDefaultPlanId: string;
  createdAt: string;
  updatedAt: string;
  plan: PlanContract;
};

const DEFAULT_DUPLICATE_TIMESTAMP = "2026-05-24T00:00:00Z";
const DOCX_PAYLOAD_KEYS = new Set([
  "sourceDocumentPath",
  "docxBinary",
  "binaryData",
  "rawFileContent",
  "base64Content",
  "embeddedDocument",
  "sourceFilename"
]);

export function duplicateDefaultPlan(
  defaultFixture: DefaultSavedPlanFixtureContract,
  options: DuplicateDefaultPlanOptions
): EditableFloorplanCopy {
  const fixture = validateDefaultSavedPlanFixtureContract(defaultFixture);
  const createdAt = options.createdAt ?? DEFAULT_DUPLICATE_TIMESTAMP;
  const updatedAt = options.updatedAt ?? createdAt;
  requireIsoTimestamp(createdAt, "createdAt");
  requireIsoTimestamp(updatedAt, "updatedAt");
  if (!options.planId || options.planId === fixture.plan.planId) {
    throw new Error("duplicate planId must be a new non-empty ID");
  }
  if (!options.name || options.name === fixture.plan.name) {
    throw new Error("duplicate name must be a new non-empty name");
  }

  const copiedPlan = deepClonePlan(fixture.plan);
  copiedPlan.planId = options.planId;
  copiedPlan.name = options.name;
  copiedPlan.createdAt = createdAt;
  copiedPlan.updatedAt = updatedAt;
  assertNoDocxPayload(copiedPlan, "plan");

  return {
    schemaVersion: "1.0.0",
    readOnly: false,
    parentDefaultPlanId: fixture.plan.planId,
    createdAt,
    updatedAt,
    plan: validatePlanContract(copiedPlan)
  };
}

function deepClonePlan(plan: PlanContract): PlanContract {
  return JSON.parse(JSON.stringify(plan)) as PlanContract;
}

function requireIsoTimestamp(value: string, label: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`${label} must be an ISO-compatible timestamp`);
  }
}

function assertNoDocxPayload(value: unknown, label: string): void {
  if (value == null || typeof value !== "object") {
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (DOCX_PAYLOAD_KEYS.has(key)) {
      throw new Error(`${label}.${key} is not allowed in editable floorplan copies`);
    }
    assertNoDocxPayload(child, `${label}.${key}`);
  }
}
