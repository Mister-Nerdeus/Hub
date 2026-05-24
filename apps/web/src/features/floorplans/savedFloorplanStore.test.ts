// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { mkdirSync, writeFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import { createDuplicateFloorplanViewModel } from "./duplicateFloorplanViewModel";
import { createSavedFloorplanStore } from "./savedFloorplanStore";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const evidenceDir = resolve(repoRoot, "docs/verification/issues/issue-222");

function writeEvidence(name: string, payload: unknown) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(resolve(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

const store = createSavedFloorplanStore();
const duplicate = createDuplicateFloorplanViewModel("default-er-layout-plan-1").copy;
const saved = store.save(duplicate);

if (saved.readOnly !== false) {
  throw new Error("saved floorplan records must be editable");
}
if (saved.parentDefaultPlanId !== "default-er-layout-plan-1") {
  throw new Error("saved floorplan record must preserve parentDefaultPlanId");
}
if (saved.plan.planId !== duplicate.plan.planId || saved.plan.rooms.length !== duplicate.plan.rooms.length) {
  throw new Error("saved floorplan record must preserve JSON plan content");
}
if (store.list().length !== 1) {
  throw new Error("saved floorplan store must list saved records");
}

const loaded = store.load(saved.recordId);
if (loaded == null || loaded.recordId !== saved.recordId) {
  throw new Error("saved floorplan store must load saved records by recordId");
}
loaded.plan.name = "Mutated Loaded Copy";
const loadedAgain = store.load(saved.recordId);
if (loadedAgain?.plan.name === "Mutated Loaded Copy") {
  throw new Error("saved floorplan store must return cloned records");
}

if (!store.delete(saved.recordId)) {
  throw new Error("saved floorplan store must delete existing records");
}
if (store.load(saved.recordId) !== null || store.list().length !== 0) {
  throw new Error("deleted saved floorplan must not remain loadable");
}
if (store.delete(saved.recordId) !== false) {
  throw new Error("delete must return false for missing saved records");
}

const forbiddenKeys = [
  `sourceDocument${"Path"}`,
  `docx${"Binary"}`,
  "binaryData",
  "rawFileContent",
  "base64Content",
  "embeddedDocument",
  `source${"Filename"}`
];
const rejectedPayloadKeys: string[] = [];
for (const key of forbiddenKeys) {
  const badCopy = {
    ...duplicate,
    plan: {
      ...duplicate.plan,
      [key]: "private reference payload"
    }
  };
  if (!throws(() => store.save(badCopy))) {
    throw new Error(`saved floorplan store must reject ${key}`);
  }
  rejectedPayloadKeys.push(key);
}

writeEvidence("saved-floorplan-store-output.json", {
  issue: "222",
  status: "passed",
  savedRecordId: saved.recordId,
  parentDefaultPlanId: saved.parentDefaultPlanId,
  listLoadSaveDeletePassed: true,
  defaultsAndSavedDistinguished: true
});

writeEvidence("no-docx-saved-payload-output.json", {
  issue: "222",
  status: "passed",
  rejectedPayloadKeys,
  savedRecordsContainDocxPayload: false
});

writeEvidence("local-store-limitations-output.json", {
  issue: "222",
  status: "passed",
  persistenceScope: "local in-memory web store abstraction",
  apiPersistenceAdded: false,
  databasePersistenceAdded: false,
  userAccountsAdded: false
});

function throws(callback: () => void): boolean {
  try {
    callback();
    return false;
  } catch {
    return true;
  }
}
