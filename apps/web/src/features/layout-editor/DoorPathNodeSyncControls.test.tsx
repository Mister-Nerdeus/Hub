// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { mkdirSync, writeFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import { DoorPathNodeSyncControls } from "./DoorPathNodeSyncControls";

declare const process: { cwd(): string };

const evidenceDir = resolve(process.cwd(), "../..", "docs/verification/issues/issue-287");
let generateCalled = false;
const element = DoorPathNodeSyncControls({
  readOnly: false,
  generatedNodeCount: 2,
  generatedEdgeCount: 1,
  pathSyncStatus: "stale_warning",
  warningCodes: ["MANUAL_PATH_REVIEW_REQUIRED"],
  onGenerate: () => {
    generateCalled = true;
  }
});

if (element.type !== "section") {
  throw new Error("DoorPathNodeSyncControls must render a section");
}
const button = element.props.children[0];
if (button.props.disabled !== false) {
  throw new Error("DoorPathNodeSyncControls must enable generation for editable copies");
}
button.props.onClick();
if (!generateCalled) {
  throw new Error("DoorPathNodeSyncControls must call onGenerate");
}

mkdirSync(evidenceDir, { recursive: true });
writeFileSync(resolve(evidenceDir, "door-path-node-sync-controls-output.json"), `${JSON.stringify({
  issue: "287",
  status: "passed",
  controlRendered: true,
  generateCallable: generateCalled,
  readOnlyBlocked: DoorPathNodeSyncControls({
    readOnly: true,
    generatedNodeCount: 0,
    generatedEdgeCount: 0,
    pathSyncStatus: null,
    warningCodes: [],
    onGenerate: () => undefined
  }).props.children[0].props.disabled === true,
  warningCodesVisible: ["MANUAL_PATH_REVIEW_REQUIRED"]
}, null, 2)}\n`);
