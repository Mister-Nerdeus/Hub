import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { validateSavedPlanRecordContract } from "../dist/index.js";
import { testAuthoringDraft, testSourceProvenance, throws } from "./authoring-test-helpers.mjs";

const record = validateSavedPlanRecordContract({
  savedPlanId: "saved-default-er-layout-plan-1-001",
  sourceDefaultPlanId: "default-er-layout-plan-1",
  planId: "editable-authoring-plan",
  displayName: "Editable Authoring Plan",
  versionLabel: "v1",
  createdAt: "2026-05-25T00:00:00Z",
  updatedAt: "2026-05-25T00:00:00Z",
  saveKind: "save_as",
  authoringDraft: testAuthoringDraft(),
  sourceProvenance: testSourceProvenance(),
  syntheticDataOnly: true
});

throws(
  () => validateSavedPlanRecordContract({ ...record, saveKind: "overwrite_default" }),
  /saveKind/
);

writeEvidence("issue-271/saved-record-contract-output.json", {
  status: "passed",
  savedPlanId: record.savedPlanId,
  saveKind: record.saveKind,
  syntheticDataOnly: record.syntheticDataOnly
});

function writeEvidence(relativePath, payload) {
  const target = resolve(process.cwd(), "../..", "docs/verification/issues", relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`);
}
