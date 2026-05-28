import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export const ISSUE_EVIDENCE_INDEX_PATH = "docs/verification/ISSUE_EVIDENCE_INDEX.json";

export function readCommittedEvidenceIndex(root = process.cwd()) {
  const absoluteIndexPath = join(root, ISSUE_EVIDENCE_INDEX_PATH);
  if (!existsSync(absoluteIndexPath) || !statSync(absoluteIndexPath).isFile()) {
    return {
      status: "failed",
      path: ISSUE_EVIDENCE_INDEX_PATH,
      exists: false,
      byteSize: 0,
      whitespaceOnly: false,
      json: null,
      failures: [`Missing issue evidence index: ${ISSUE_EVIDENCE_INDEX_PATH}`]
    };
  }

  const content = readFileSync(absoluteIndexPath, "utf8");
  const byteSize = statSync(absoluteIndexPath).size;
  const whitespaceOnly = content.trim().length === 0;
  const failures = [];
  if (byteSize === 0) failures.push(`Issue evidence index is empty: ${ISSUE_EVIDENCE_INDEX_PATH}`);
  if (whitespaceOnly) failures.push(`Issue evidence index is whitespace-only: ${ISSUE_EVIDENCE_INDEX_PATH}`);

  let json = null;
  if (failures.length === 0) {
    try {
      json = JSON.parse(content);
    } catch (error) {
      failures.push(`Issue evidence index is not valid JSON: ${error.message}`);
    }
  }

  return {
    status: failures.length === 0 ? "passed" : "failed",
    path: ISSUE_EVIDENCE_INDEX_PATH,
    exists: true,
    byteSize,
    whitespaceOnly,
    json,
    failures
  };
}

export function summarizeEvidenceIndexContent(root = process.cwd()) {
  const content = readCommittedEvidenceIndex(root);
  return {
    status: content.status,
    path: content.path,
    byteSize: content.byteSize,
    whitespaceOnly: content.whitespaceOnly,
    schemaVersion: content.json?.schemaVersion ?? null,
    lastRebuiltIssue: content.json?.lastRebuiltIssue ?? null,
    issueCount: Array.isArray(content.json?.issues) ? content.json.issues.length : 0,
    failures: content.failures
  };
}
