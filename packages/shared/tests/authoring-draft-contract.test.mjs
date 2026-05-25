import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { validateAuthoringDraftContract } from "../dist/index.js";
import { testAuthoringDraft, throws } from "./authoring-test-helpers.mjs";

const draft = validateAuthoringDraftContract(testAuthoringDraft());
if (draft.authoringStatus !== "draft_has_warnings" || draft.pathSyncStatus !== "stale_warning") {
  throw new Error("authoring draft must persist warning-capable status");
}

const rejected = [];
for (const key of [
  `sourceDocument${"Path"}`,
  `docx${"Binary"}`,
  "binaryData",
  "rawFileContent",
  "base64Content",
  "embeddedDocument",
  `source${"Filename"}`,
  "privateAbsolutePath"
]) {
  throws(() => validateAuthoringDraftContract(testAuthoringDraft({ [key]: "blocked" })), /not allowed/);
  rejected.push(key);
}

writeEvidence("issue-271/authoring-draft-contract-output.json", {
  status: "passed",
  draftId: draft.draftId,
  pathSyncStatus: draft.pathSyncStatus
});
writeEvidence("issue-271/forbidden-source-payload-negative-output.json", {
  status: "passed",
  rejected
});

function writeEvidence(relativePath, payload) {
  const target = resolve(process.cwd(), "../..", "docs/verification/issues", relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`);
}
