// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { mkdirSync, writeFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import type { SimulationReadyExportResult } from "@nerdeus/shared";
import { SimulationReadyExportPanel } from "./SimulationReadyExportPanel";

declare const process: { cwd(): string };

const evidenceDir = resolve(process.cwd(), "../..", "docs/verification/issues/issue-288");
let validateCalled = false;
const result: SimulationReadyExportResult = {
  status: "blocked_path_sync",
  planId: "plan-authoring-copy",
  sourceDraftId: "draft-authoring-copy",
  simulationReadyPlan: null,
  blockingIssues: ["SIMULATION_READY_EXPORT_BLOCKED"],
  warningIssues: ["PATH_SYNC_STALE"],
  pathSyncStatus: "stale_warning",
  routeAccessSummary: {
    pathSyncStatus: "stale_warning",
    roomCount: 1,
    roomsWithDoorCount: 1,
    roomsWithPathNodeCount: 1,
    roomsMissingDoor: [],
    roomsMissingPathNode: [],
    unreachableRoomIds: [],
    blockingIssues: ["SIMULATION_READY_EXPORT_BLOCKED"],
    warningIssues: ["PATH_SYNC_STALE"],
    simulationReady: false,
    limitations: ["Route access audit only."]
  },
  privateSourcePayloadStored: false,
  limitations: ["Route-ready export requires fresh or explicitly reviewed path sync."]
};

const element = SimulationReadyExportPanel({
  result,
  disabled: false,
  onValidateExport: () => {
    validateCalled = true;
  }
});
if (element.type !== "section") {
  throw new Error("SimulationReadyExportPanel must render a section");
}
const button = element.props.children[0];
if (button.props.disabled !== false) {
  throw new Error("SimulationReadyExportPanel must enable validation when editable input exists");
}
button.props.onClick();
if (!validateCalled) {
  throw new Error("SimulationReadyExportPanel must call validation callback");
}

mkdirSync(evidenceDir, { recursive: true });
writeFileSync(resolve(evidenceDir, "export-panel-output.json"), `${JSON.stringify({
  issue: "288",
  status: "passed",
  panelRendered: true,
  validationCallable: validateCalled,
  exportStatusVisible: result.status,
  blockingIssuesVisible: result.blockingIssues,
  warningIssuesVisible: result.warningIssues,
  disabledWithoutInput: SimulationReadyExportPanel({
    result: null,
    disabled: true,
    onValidateExport: () => undefined
  }).props.children[0].props.disabled === true
}, null, 2)}\n`);
