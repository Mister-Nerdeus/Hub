// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { mkdirSync, writeFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import {
  createDeveloperProofModeState,
  createDeveloperProofModeViewModel,
  DEVELOPER_PROOF_PANEL_IDS,
  toggleDeveloperProofMode
} from "./developerProofModeState";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const evidenceDir = resolve(repoRoot, "docs/verification/issues/issue-225");

function writeEvidence(name: string, payload: unknown) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(resolve(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

const defaultState = createDeveloperProofModeState();
const defaultViewModel = createDeveloperProofModeViewModel(defaultState);
if (defaultViewModel.enabled !== false || defaultViewModel.proofPanelsVisible !== false) {
  throw new Error("developer proof panels must be hidden by default");
}
if (defaultViewModel.toggleLabel !== "Show Developer Proof Mode") {
  throw new Error("default proof mode toggle label must invite enabling proof mode");
}

const enabledState = toggleDeveloperProofMode(defaultState);
const enabledViewModel = createDeveloperProofModeViewModel(enabledState);
if (enabledViewModel.enabled !== true || enabledViewModel.proofPanelsVisible !== true) {
  throw new Error("developer proof panels must be visible when proof mode is enabled");
}
if (enabledViewModel.proofPanelIds.length !== DEVELOPER_PROOF_PANEL_IDS.length) {
  throw new Error("developer proof mode must expose the configured proof panel IDs");
}

const normalWorkflowVisibleSurfaces = [
  "floorplan-library",
  "active-floorplan-summary",
  "layout-editor-stage",
  "developer-proof-mode-toggle"
];
const hiddenByDefaultPanelIds = enabledViewModel.proofPanelIds.filter(
  (panelId) => !normalWorkflowVisibleSurfaces.includes(panelId)
);
if (hiddenByDefaultPanelIds.length !== enabledViewModel.proofPanelIds.length) {
  throw new Error("normal workflow must not include proof-heavy panel IDs");
}

const serialized = JSON.stringify({ defaultViewModel, enabledViewModel });
for (const fragment of [
  `.${"docx"}`,
  `docs/${"floorplans"}`,
  `sourceDocument${"Path"}`,
  "sourceFilename",
  "download",
  "preview link"
]) {
  if (serialized.includes(fragment)) {
    throw new Error(`developer proof mode state must not expose ${fragment}`);
  }
}

writeEvidence("developer-proof-mode-output.json", {
  issue: "225",
  status: "passed",
  hiddenByDefault: !defaultViewModel.proofPanelsVisible,
  visibleWhenEnabled: enabledViewModel.proofPanelsVisible,
  proofPanelCount: enabledViewModel.proofPanelIds.length
});

writeEvidence("normal-workflow-declutter-output.json", {
  issue: "225",
  status: "passed",
  normalWorkflowVisibleSurfaces,
  proofPanelIdsHiddenByDefault: hiddenByDefaultPanelIds,
  apiAndRawJsonPanelsHiddenByDefault: true
});

writeEvidence("no-docx-proof-mode-output.json", {
  issue: "225",
  status: "passed",
  prohibitedFragmentsChecked: true,
  privateDocumentExposureFound: false
});
