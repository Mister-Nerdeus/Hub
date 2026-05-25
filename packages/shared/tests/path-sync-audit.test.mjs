import { auditPathSyncStatus } from "../dist/index.js";
import { testAuthoringDraft, testPlan } from "./authoring-test-helpers.mjs";

const audit = auditPathSyncStatus({ authoringDraft: testAuthoringDraft(), plan: testPlan });
if (audit.roomCount !== 1 || audit.roomsWithDoorCount !== 1) {
  throw new Error("audit must count room door access");
}
if (!audit.roomsMissingPathNode.includes("room-01")) {
  throw new Error("audit must identify rooms missing path node access");
}
if (!audit.blockingIssues.includes("ROOM_MISSING_PATH_NODE")) {
  throw new Error("missing path nodes must block simulation-ready export");
}
if (!audit.warningIssues.includes("PATH_SYNC_STALE")) {
  throw new Error("stale path sync must be visible in audit warnings");
}
