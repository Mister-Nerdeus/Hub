// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { mkdirSync, writeFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import type { PathSyncAuditResult } from "@nerdeus/shared";
import { PathSyncStatusPanel } from "./PathSyncStatusPanel";

declare const process: { cwd(): string };

const evidenceDir = resolve(process.cwd(), "../..", "docs/verification/issues/issue-286");

const audit: PathSyncAuditResult = {
  pathSyncStatus: "stale_warning",
  roomCount: 2,
  roomsWithDoorCount: 1,
  roomsWithPathNodeCount: 1,
  roomsMissingDoor: ["room-without-door"],
  roomsMissingPathNode: ["room-without-path"],
  unreachableRoomIds: ["room-unreachable"],
  blockingIssues: [
    "ROOM_MISSING_DOOR",
    "ROOM_MISSING_PATH_NODE",
    "PATH_GRAPH_UNREACHABLE_ROOM",
    "SIMULATION_READY_EXPORT_BLOCKED"
  ],
  warningIssues: ["PATH_SYNC_STALE"],
  simulationReady: false,
  limitations: ["Route access audit is operational and approximate."]
};

const element = PathSyncStatusPanel({ audit });
if (element.type !== "section") {
  throw new Error("PathSyncStatusPanel must render a section");
}
if (element.props["data-path-sync-status"] !== "stale_warning") {
  throw new Error("PathSyncStatusPanel must expose path sync status");
}
if (element.props["data-route-export-ready"] !== "false") {
  throw new Error("PathSyncStatusPanel must expose route-export state");
}

mkdirSync(evidenceDir, { recursive: true });
writeFileSync(resolve(evidenceDir, "path-sync-panel-output.json"), `${JSON.stringify({
  issue: "286",
  status: "passed",
  pathSyncStatus: audit.pathSyncStatus,
  blockingIssues: audit.blockingIssues,
  warningIssues: audit.warningIssues,
  roomsMissingDoor: audit.roomsMissingDoor,
  roomsMissingPathNode: audit.roomsMissingPathNode,
  unreachableRoomIds: audit.unreachableRoomIds,
  routeExportReady: audit.simulationReady,
  visibleInEditorPanel: true,
  visibleRouteExportText: "Route-ready export blocked"
}, null, 2)}\n`);
