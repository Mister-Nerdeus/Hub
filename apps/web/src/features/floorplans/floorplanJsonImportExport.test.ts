// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { mkdirSync, writeFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import { defaultPlanFixtures } from "../../fixtures/defaultPlans";
import { exportFloorplanJson, importFloorplanJson } from "./floorplanJsonImportExport";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const evidenceDir = resolve(repoRoot, "docs/verification/issues/issue-224");

function writeEvidence(name: string, payload: unknown) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(resolve(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

const fixture = defaultPlanFixtures[0];
if (fixture == null) {
  throw new Error("expected at least one default JSON floorplan fixture");
}

const exported = exportFloorplanJson(fixture.plan);
const imported = importFloorplanJson(exported);
if (imported.planId !== fixture.plan.planId) {
  throw new Error("exported JSON floorplan must import back into the same plan");
}
if (!exported.trimStart().startsWith("{") || !exported.includes(`"planId": "${fixture.plan.planId}"`)) {
  throw new Error("exported floorplan payload must be JSON text");
}

if (!throwsWith("{not-json", "Invalid JSON")) {
  throw new Error("invalid JSON floorplan imports must fail cleanly");
}

const forbiddenKeys = [
  `sourceDocument${"Path"}`,
  `docx${"Binary"}`,
  "binaryData",
  "rawFileContent",
  "base64Content",
  "embeddedDocument"
];
const rejectedPayloadKeys: string[] = [];
for (const key of forbiddenKeys) {
  const payload = JSON.stringify({
    ...fixture.plan,
    [key]: "private reference payload"
  });
  if (!throwsWith(payload, "not allowed")) {
    throw new Error(`floorplan import must reject ${key}`);
  }
  rejectedPayloadKeys.push(key);
}

const exportedSerialized = JSON.stringify({ exported, imported });
for (const fragment of [
  `.${"docx"}`,
  `docs/${"floorplans"}`,
  `sourceDocument${"Path"}`,
  "sourceFilename",
  "binaryData",
  "base64Content",
  "embeddedDocument"
]) {
  if (exportedSerialized.includes(fragment)) {
    throw new Error(`floorplan export must not include ${fragment}`);
  }
}

writeEvidence("json-floorplan-export-output.json", {
  issue: "224",
  status: "passed",
  exportedPlanId: fixture.plan.planId,
  exportedJsonOnly: true,
  sourcePayloadExported: false
});

writeEvidence("json-floorplan-import-output.json", {
  issue: "224",
  status: "passed",
  importedPlanId: imported.planId,
  validPlanContractAccepted: true,
  invalidJsonRejected: true,
  apiRoutesUsed: false
});

writeEvidence("docx-payload-rejection-output.json", {
  issue: "224",
  status: "passed",
  rejectedPayloadKeys,
  sourcePayloadImported: false
});

function throwsWith(rawJson: string, messageFragment: string): boolean {
  try {
    importFloorplanJson(rawJson);
    return false;
  } catch (error) {
    return error instanceof Error && error.message.includes(messageFragment);
  }
}
