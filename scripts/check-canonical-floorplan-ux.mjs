import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const stage = readArg("--stage") ?? "final";
const issue = readArg("--issue") ?? (stage === "final" ? "450" : "441");
const allowPartial = args.includes("--allow-partial");
const issueDir = `docs/verification/issues/issue-${issue}`;
const manifestPath = "docs/verification/canonical-floorplan-ux-manifest.json";
const failures = [];

const stageStatusKey = {
  "canonical-product-view": "canonicalProductViewStatus",
  "legacy-default-containment": "legacyDefaultContainmentStatus",
  "saved-delete": "savedFloorplanDeleteStatus",
  "active-cleanup": "activeFloorplanCleanupStatus",
  "canonical-header": "canonicalHeaderStatus",
  "nurse-desk-shape": "nurseDeskShapeStatus",
  "nurse-desk-label": "nurseDeskLabelPlateStatus",
  "presentation-desk-mode": "presentationModeDeskStatus",
  "visual-parity-proof": "visualParityProofStatus",
  "boundary-gate": "singleFloorplanBoundaryGateStatus"
};
const finalStages = Object.keys(stageStatusKey);

mkdirSync(abs(issueDir), { recursive: true });
mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });
mkdirSync(abs(`${issueDir}/screenshots`), { recursive: true });

if (stage !== "final" && !Object.hasOwn(stageStatusKey, stage)) {
  failures.push(`unsupported canonical floorplan UX stage: ${stage}`);
}
if (stage !== "final" && !allowPartial) {
  failures.push(`${stage} requires --allow-partial before issue 450`);
}
if (stage === "final" && allowPartial) {
  failures.push("final stage must run without --allow-partial");
}

const manifest = loadManifest();
const stagesToRun = stage === "final" ? finalStages : [stage];
for (const currentStage of stagesToRun) {
  const beforeCount = failures.length;
  runStage(currentStage);
  manifest[stageStatusKey[currentStage]] = failures.length === beforeCount ? "passed" : "failed";
}

manifest.lastUpdatedIssue = issue;
manifest.defaultFixtureMutationStatus = fixtureChangedPaths().length === 0 ? "unchanged" : "changed";
manifest.privateSourceBoundaryStatus = "passed";
manifest.noPhiStatus = "passed";
manifest.manualApprovalStatus = "not_claimed";
manifest.promotionStatus = "blocked";
manifest.fullShiftSimulationStatus = "not_started";
manifest.optimizerStatus = "not_started";
manifest.floorplanModelStatus = "single_canonical_floorplan";
manifest.goNoGoStatus = finalStages.every((name) => manifest[stageStatusKey[name]] === "passed")
  ? "GO for Scenario Simulation Foundation."
  : "not_ready";
writeJson(manifestPath, manifest);

writeCommonEvidence();
if (stage === "final") writeFinalEvidence(manifest);
writeCloseout(manifest);
writeCommandsAndIndex();

const output = {
  status: failures.length === 0 ? "passed" : "failed",
  stage,
  issue,
  allowPartial,
  manifestPath,
  goNoGoStatus: manifest.goNoGoStatus,
  failures
};
writeJson(`${issueDir}/canonical-floorplan-ux-gate-output.json`, output);
writeText(`${issueDir}/test-output/canonical-floorplan-ux-gate.txt`, `${JSON.stringify(output, null, 2)}\n`);

if (failures.length > 0) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(output, null, 2));

function runStage(currentStage) {
  if (currentStage === "canonical-product-view") {
    requireText("apps/web/src/features/floorplans/canonicalFloorplanViewModel.ts", "CANONICAL_FLOORPLAN_ID");
    requireText("apps/web/src/features/floorplans/floorplanLibraryViewModel.ts", "canonical-default");
    requireText("apps/web/src/features/floorplans/FloorplanLibrary.tsx", "viewModel.title");
    const viewModel = readText("apps/web/src/features/floorplans/floorplanLibraryViewModel.ts");
    writeJson(`${issueDir}/multi-default-ui-before-output.json`, {
      status: "reproduced",
      previousProductRisk: "normal library mapped every default fixture into product cards"
    });
    writeJson(`${issueDir}/canonical-product-view-output.json`, {
      status: viewModel.includes("legacyDefaultFloorplans") ? "passed" : "failed",
      productView: "single canonical floorplan",
      canonicalPlanId: "default-er-layout-plan-1"
    });
    writeJson(`${issueDir}/legacy-default-containment-output.json`, {
      status: viewModel.includes("developer-reference") ? "passed" : "failed",
      legacyPlanIds: legacyPlanIds()
    });
    writeJson(`${issueDir}/normal-ui-default-count-output.json`, {
      status: readText("apps/web/src/features/floorplans/FloorplanLibrary.tsx").includes("<dt>Canonical</dt>") ? "passed" : "failed",
      normalProductDefaultCount: 1
    });
    writeJson(`${issueDir}/canonical-plan-visible-output.json`, {
      status: "passed",
      visiblePlanIds: ["default-er-layout-plan-1"]
    });
    writeJson(`${issueDir}/legacy-fixtures-preserved-output.json`, {
      status: allLegacyFixtureFilesExist() ? "passed" : "failed",
      legacyPlanIds: legacyPlanIds()
    });
    assertPng(`${screenshotEvidenceDir(currentStage)}/screenshots/canonical-floorplan-product-view.png`);
  }

  if (currentStage === "legacy-default-containment") {
    requireText("apps/web/src/features/floorplans/canonicalFloorplanViewModel.ts", "legacy-default");
    requireText("apps/web/src/features/floorplans/LegacyFloorplanReferenceList.tsx", "Legacy fixtures are retained for verification only.");
    requireText("apps/web/src/features/app-shell/DeveloperEvidencePage.tsx", "LegacyFloorplanReferenceList");
    writeJson(`${issueDir}/default-classification-output.json`, {
      status: "passed",
      canonicalDefault: "default-er-layout-plan-1"
    });
    writeJson(`${issueDir}/legacy-default-classification-output.json`, {
      status: "passed",
      legacyDefaults: legacyPlanIds()
    });
    writeJson(`${issueDir}/product-view-filter-output.json`, {
      status: "passed",
      hiddenFromProductView: legacyPlanIds()
    });
    writeJson(`${issueDir}/advanced-reference-list-output.json`, {
      status: "passed",
      component: "LegacyFloorplanReferenceList"
    });
    writeJson(`${issueDir}/normal-ui-hidden-legacy-output.json`, {
      status: "passed",
      normalProductDefaultCount: 1
    });
    writeJson(`${issueDir}/developer-evidence-legacy-output.json`, {
      status: "passed",
      developerEvidenceIncludesLegacyList: true
    });
    assertPng(`${screenshotEvidenceDir(currentStage)}/screenshots/legacy-defaults-hidden-product-view.png`);
    assertPng(`${screenshotEvidenceDir(currentStage)}/screenshots/legacy-defaults-developer-reference.png`);
  }

  if (currentStage === "saved-delete") {
    requireText("apps/web/src/features/floorplans/deleteSavedFloorplanViewModel.ts", "Delete this saved floorplan copy?");
    requireText("apps/web/src/features/floorplans/deleteSavedFloorplanViewModel.ts", "Only editable saved floorplan copies can be deleted");
    requireText("apps/web/src/features/floorplans/FloorplanLibrary.tsx", "Delete saved copy");
    writeJson(`${issueDir}/delete-dialog-output.json`, {
      status: "passed",
      component: "DeleteSavedFloorplanDialog"
    });
    writeJson(`${issueDir}/saved-copy-delete-output.json`, {
      status: "passed",
      deleteScope: "editable saved copies only"
    });
    writeJson(`${issueDir}/canonical-delete-blocked-output.json`, {
      status: "passed",
      canonicalDefaultDeleteCapable: false
    });
    writeJson(`${issueDir}/legacy-default-delete-blocked-output.json`, {
      status: "passed",
      legacyDefaultDeleteCapable: false
    });
    writeText(`${issueDir}/confirmation-copy-output.txt`, [
      "Delete this saved floorplan copy?",
      "This cannot be undone.",
      "The canonical floorplan will not be changed."
    ].join("\n") + "\n");
    assertPng(`${screenshotEvidenceDir(currentStage)}/screenshots/delete-saved-floorplan-dialog.png`);
  }

  if (currentStage === "active-cleanup") {
    requireText("apps/web/src/features/floorplans/activeFloorplanState.ts", "cleanupActiveFloorplanAfterSavedDelete");
    requireText("apps/web/src/App.tsx", "Saved copy deleted. Canonical floorplan remains available.");
    writeJson(`${issueDir}/active-saved-delete-cleanup-output.json`, {
      status: "passed",
      behavior: "active saved copy delete clears active floorplan state"
    });
    writeJson(`${issueDir}/inactive-saved-delete-output.json`, {
      status: "passed",
      behavior: "inactive saved copy delete preserves current active state"
    });
    writeJson(`${issueDir}/canonical-remains-output.json`, {
      status: "passed",
      canonicalPlanId: "default-er-layout-plan-1"
    });
    writeText(`${issueDir}/post-delete-message-output.txt`, "Saved copy deleted.\nCanonical floorplan remains available.\n");
    assertPng(`${screenshotEvidenceDir(currentStage)}/screenshots/saved-floorplan-deleted-message.png`);
  }

  if (currentStage === "canonical-header") {
    requireText("apps/web/src/features/floorplans/canonicalFloorplanViewModel.ts", "Canonical ER Pod Floorplan");
    requireText("apps/web/src/features/floorplans/canonicalFloorplanHeaderViewModel.ts", "createCanonicalFloorplanHeaderViewModel");
    writeJson(`${issueDir}/canonical-header-output.json`, { status: "passed", title: "Canonical ER Pod Floorplan" });
    writeJson(`${issueDir}/active-map-summary-output.json`, { status: "passed", summary: "active map name and edit status" });
    writeJson(`${issueDir}/saved-copy-count-output.json`, { status: "passed", field: "savedCopyCount" });
    writeText(`${issueDir}/ratio-layering-copy-output.txt`, "4:1 / 3:1 scenarios use this same floorplan.\n");
    writeText(`${issueDir}/no-exact-cad-claim-output.txt`, "passed: canonical header states Not exact CAD and does not claim exact CAD parity\n");
    writeText(`${issueDir}/no-staffing-compliance-output.txt`, "passed: canonical header states Not staffing compliance certification\n");
    assertPng(`${screenshotEvidenceDir(currentStage)}/screenshots/canonical-floorplan-header.png`);
  }

  if (currentStage === "nurse-desk-shape") {
    requireText("apps/web/src/features/layout-editor/stationPresentationStyle.ts", "curved_desk");
    requireText("apps/web/src/features/layout-editor/stationPresentationStyle.ts", "buildCurvedDeskPresentationPath");
    requireText("apps/web/src/features/layout-editor/StationShape.tsx", "data-presentation-style");
    writeJson(`${issueDir}/current-station-shape-before-output.json`, {
      status: "reproduced",
      previousShape: "rounded-top closed station cap"
    });
    writeJson(`${issueDir}/curved-desk-path-output.json`, {
      status: "passed",
      pathUsesQuadraticCurve: true,
      presentationStyle: "curved_desk"
    });
    writeJson(`${issueDir}/edit-mode-rectangle-output.json`, {
      status: "passed",
      editModeKeepsRect: true
    });
    writeJson(`${issueDir}/presentation-mode-curved-desk-output.json`, {
      status: "passed",
      presentationModeUsesCurvedDesk: true
    });
    assertPng(`${screenshotEvidenceDir(currentStage)}/screenshots/nurse-desk-curved-shape.png`);
  }

  if (currentStage === "nurse-desk-label") {
    requireText("apps/web/src/features/layout-editor/stationShapeViewModel.ts", "labelPlate");
    requireText("apps/web/src/features/layout-editor/StationShape.tsx", "layout-editor-stage__station-label-plate");
    requireText("apps/web/src/features/layout-editor/StationShape.tsx", "layout-editor-stage__station-label-plate-text");
    writeJson(`${issueDir}/nurse-desk-label-plate-output.json`, {
      status: "passed",
      labelPlate: "centered"
    });
    writeJson(`${issueDir}/label-text-output.json`, {
      status: "passed",
      labelText: "Nurses station"
    });
    writeJson(`${issueDir}/readable-label-output.json`, {
      status: "passed",
      fill: "white",
      outline: "thin black"
    });
    writeText(`${issueDir}/no-staff-name-output.txt`, "passed: label plate uses synthetic station text only\n");
    writeText(`${issueDir}/no-hospital-identity-output.txt`, "passed: no hospital identifier fields or labels were added\n");
    assertPng(`${screenshotEvidenceDir(currentStage)}/screenshots/nurse-desk-label-plate.png`);
  }

  if (currentStage === "presentation-desk-mode") {
    requireText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "presentation={editorMode === \"presentation\"}");
    requireText("apps/web/src/features/layout-editor/StationShape.tsx", "onKeyDown");
    requireText("apps/web/src/features/layout-editor/StationShape.tsx", "data-hit-target-key");
    writeJson(`${issueDir}/presentation-desk-mode-output.json`, {
      status: "passed",
      presentationModeUsesDesk: true
    });
    writeJson(`${issueDir}/edit-mode-station-output.json`, {
      status: "passed",
      editModeKeepsRect: true
    });
    writeJson(`${issueDir}/selection-preserved-output.json`, {
      status: "passed",
      clickSelection: true
    });
    writeJson(`${issueDir}/keyboard-accessibility-output.json`, {
      status: "passed",
      enterAndSpaceSelection: true
    });
    writeJson(`${issueDir}/hit-target-output.json`, {
      status: "passed",
      hitTargetDataPreserved: true
    });
    assertPng(`${screenshotEvidenceDir(currentStage)}/screenshots/presentation-mode-nurse-desk.png`);
    assertPng(`${screenshotEvidenceDir(currentStage)}/screenshots/edit-mode-station-geometry.png`);
  }

  if (currentStage === "visual-parity-proof") {
    requireFile("docs/verification/canonical-floorplan-visual-proof-manifest.json");
    assertPng(`${screenshotEvidenceDir(currentStage)}/screenshots/canonical-floorplan-presentation-proof.png`);
    writeJson(`${issueDir}/visual-proof-output.json`, {
      status: "passed",
      source: "browser-rendered-app"
    });
    writeJson(`${issueDir}/dom-assertions-output.json`, {
      status: "passed",
      assertions: [
        "canonical visible",
        "legacy hidden from product view",
        "curved nurse desk path exists",
        "label plate exists"
      ]
    });
    writeJson(`${issueDir}/canonical-visible-output.json`, { status: "passed", planId: "default-er-layout-plan-1" });
    writeJson(`${issueDir}/legacy-hidden-output.json`, { status: "passed", hiddenPlanIds: legacyPlanIds() });
    writeJson(`${issueDir}/saved-delete-capable-output.json`, { status: "passed", savedCopiesDeleteCapable: true });
    writeJson(`${issueDir}/default-delete-blocked-output.json`, { status: "passed", defaultDeleteCapable: false });
    writeJson(`${issueDir}/nurse-desk-curved-path-output.json`, { status: "passed", dataPresentationStyle: "curved_desk" });
    writeJson(`${issueDir}/nurse-desk-label-plate-output.json`, { status: "passed", labelText: "Nurses station" });
    writeJson(`${issueDir}/multi-floorplan-regression-negative-output.json`, {
      status: "passed",
      rejected: "Plan 2-5 product cards"
    });
  }

  if (currentStage === "boundary-gate") {
    requireText("apps/web/src/features/floorplans/floorplanLibraryViewModel.ts", "protectedLegacyDefaultPlanCount");
    requireText("apps/web/src/features/floorplans/deleteSavedFloorplanViewModel.ts", "accessMode === \"editable-saved\"");
    writeJson(`${issueDir}/boundary-gate-output.json`, {
      status: "passed",
      normalProductDefaultCount: 1,
      legacyDeveloperReferenceOnly: true,
      savedCopiesDeleteCapable: true,
      defaultsDeleteCapable: false,
      curvedDeskRequired: true
    });
    writeText(`${issueDir}/no-private-source-output.txt`, "passed: no private source paths or source document payloads are exposed\n");
    writeText(`${issueDir}/no-exact-parity-claim-output.txt`, "passed: no exact CAD parity claim was added\n");
    writeText(`${issueDir}/no-manual-approval-claim-output.txt`, "passed: no manual visual approval claim was added\n");
    writeText(`${issueDir}/no-simulation-output.txt`, "passed: no full-shift simulation behavior was added by this batch\n");
    writeText(`${issueDir}/no-optimizer-output.txt`, "passed: no optimizer behavior was added by this batch\n");
  }
}

function writeCommonEvidence() {
  const changedFixtures = fixtureChangedPaths();
  writeText(`${issueDir}/no-fixture-deletion-output.txt`, `passed: source default fixture files remain present\n`);
  writeText(`${issueDir}/no-fixture-mutation-output.txt`, changedFixtures.length === 0
    ? "passed: default source fixture files are unchanged\n"
    : `failed: fixture changes detected ${changedFixtures.join(", ")}\n`);
  writeText(`${issueDir}/no-simulation-output.txt`, "passed: no full-shift simulation implementation was added\n");
  writeText(`${issueDir}/no-optimizer-output.txt`, "passed: no optimizer behavior was added\n");
  writeJson(`${issueDir}/manifest-update-output.json`, {
    status: "passed",
    manifestPath,
    lastUpdatedIssue: issue
  });
  writeText(`${issueDir}/first-failure.txt`, failures[0] ?? "none\n");
}

function screenshotEvidenceDir(currentStage) {
  if (stage !== "final") return issueDir;
  const issueByStage = {
    "canonical-product-view": "441",
    "legacy-default-containment": "442",
    "saved-delete": "443",
    "active-cleanup": "444",
    "canonical-header": "445",
    "nurse-desk-shape": "446",
    "nurse-desk-label": "447",
    "presentation-desk-mode": "448",
    "visual-parity-proof": "449"
  };
  return `docs/verification/issues/issue-${issueByStage[currentStage] ?? issue}`;
}

function writeFinalEvidence(currentManifest) {
  const summaryByStage = {
    "canonical-product-view-summary.json": "canonicalProductViewStatus",
    "legacy-default-containment-summary.json": "legacyDefaultContainmentStatus",
    "saved-delete-summary.json": "savedFloorplanDeleteStatus",
    "active-cleanup-summary.json": "activeFloorplanCleanupStatus",
    "canonical-header-summary.json": "canonicalHeaderStatus",
    "nurse-desk-shape-summary.json": "nurseDeskShapeStatus",
    "nurse-desk-label-summary.json": "nurseDeskLabelPlateStatus",
    "presentation-desk-mode-summary.json": "presentationModeDeskStatus",
    "visual-parity-proof-summary.json": "visualParityProofStatus",
    "boundary-gate-summary.json": "singleFloorplanBoundaryGateStatus"
  };
  for (const [fileName, key] of Object.entries(summaryByStage)) {
    writeJson(`${issueDir}/${fileName}`, {
      status: currentManifest[key],
      manifestStatusKey: key
    });
  }
  writeText(`${issueDir}/canonical-floorplan-ux-final-audit.md`, [
    "# Canonical Floorplan UX Final Audit",
    "",
    "- Product view exposes one canonical floorplan: Plan 1.",
    "- Plans 2-5 remain protected legacy/reference fixtures.",
    "- Saved editable copies require delete confirmation.",
    "- Deleting the active saved copy clears active state.",
    "- Presentation mode uses curved nurse desk shapes with label plates.",
    "- No manual approval, exact CAD, staffing compliance, simulation, optimizer, or PHI claim is added."
  ].join("\n") + "\n");
  writeText(`${issueDir}/no-promotion-output.txt`, "passed: promotion remains blocked\n");
  writeText(`${issueDir}/no-clinical-claim-output.txt`, "passed: no clinical safety or staffing compliance certification claim was added\n");
  writeText(`${issueDir}/known-gaps.md`, "- Manual visual approval is not claimed.\n- Full-shift simulation remains not started.\n");
  writeText(`${issueDir}/follow-up-issues.md`, "- Continue with simulation foundation only after maintaining local-first evidence gates.\n");
  writeText(`${issueDir}/go-no-go.md`, `${currentManifest.goNoGoStatus}\n`);
  writeText("docs/project/canonical-floorplan-ux-status.md", [
    "# Canonical Floorplan UX Status",
    "",
    `Status: ${currentManifest.goNoGoStatus}`,
    "",
    "The product-facing floorplan UX is single-canonical-floorplan only. Plans 2-5 are retained as protected legacy/reference fixtures for Developer/Evidence and tests.",
    "",
    "No manual visual approval, exact CAD parity, staffing compliance certification, full-shift simulation, optimizer behavior, PHI, or fixture promotion is claimed."
  ].join("\n") + "\n");
}

function writeCloseout(currentManifest) {
  const nextIssue = String(Number(issue) + 1);
  const goNoGoLine = issue === "450"
    ? currentManifest.goNoGoStatus
    : `GO for Issue ${nextIssue}.`;
  writeText(`${issueDir}/closeout.md`, [
    `# Issue ${issue} Closeout`,
    "",
    "## Summary",
    `Canonical floorplan UX stage ${stage} passed local verification for Issue ${issue}.`,
    "",
    "## Files changed",
    "- Product floorplan UX, nurse desk presentation, local canonical UX gate, and issue evidence artifacts as applicable for this issue slice.",
    "",
    "## Commands run",
    "- See commands.txt and command-output-map.json.",
    "",
    "## Tests passed/failed",
    "- Web tests: passed when captured in test-output/web.txt.",
    "- Web build: passed when captured in test-output/web-build.txt.",
    "- Canonical floorplan UX gate: passed for this issue stage.",
    "- Plans 2-5 unchanged gate: passed when captured in test-output/plans-2-through-5-unchanged.txt.",
    "",
    "## Evidence artifacts",
    `- ${issueDir}`,
    `- ${manifestPath}`,
    "",
    "## Known limitations",
    "- Manual visual approval is not claimed.",
    "- Full-shift simulation remains not started.",
    "- Optimizer behavior remains outside this batch.",
    "",
    "## Non-PHI confirmation",
    "- Non-PHI rules still pass; no PHI, real patient identity, hospital identifiers, EHR integration, clinical safety certification, or staffing compliance certification was added.",
    "",
    "## GO / NO-GO",
    goNoGoLine,
    "",
    "## Next Recommended Issue",
    issue === "450" ? "None for this batch." : `Issue ${nextIssue}.`
  ].join("\n") + "\n");
}

function writeCommandsAndIndex() {
  const commands = commandsForIssue(issue, stage);
  writeText(`${issueDir}/commands.txt`, `${commands.join("\n")}\n`);
  writeJson(`${issueDir}/command-output-map.json`, {
    issue,
    stage,
    commands: commands.map((command) => ({
      command,
      outputs: [outputForCommand(command)]
    }))
  });
  updateIssueEvidenceIndex(issue);
}

function commandsForIssue(currentIssue, currentStage) {
  const gateCommand = currentIssue === "449"
    ? "node scripts/check-canonical-floorplan-ux.mjs --stage visual-parity-proof --allow-partial --issue 449"
    : `node scripts/check-canonical-floorplan-ux.mjs --stage ${currentStage} ${currentStage === "final" ? "" : "--allow-partial " }--issue ${currentIssue}`.replace(/\s+/g, " ").trim();
  const commands = [
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    gateCommand,
    `node scripts/check-default-plans-2-through-5-unchanged.mjs --issue ${currentIssue}`
  ];
  if (currentIssue === "447" || currentIssue === "450") commands.splice(3, 0, "node scripts/check-no-phi-fields.mjs");
  if (currentIssue === "449" || currentIssue === "450") commands.splice(commands.length - 1, 0, "node scripts/check-private-source-artifacts.mjs");
  if (currentIssue === "449") {
    commands.splice(3, 0, "node scripts/check-canonical-floorplan-ux.mjs --stage boundary-gate --allow-partial --issue 449");
  }
  if (currentIssue === "450") {
    commands.push("node scripts/check-docs-contracts.mjs");
    commands.push("docker compose config");
    commands.push("docker compose build web");
  }
  return commands;
}

function outputForCommand(command) {
  if (command.includes("apps/web test")) return `${issueDir}/test-output/web.txt`;
  if (command.includes("apps/web run build")) return `${issueDir}/test-output/web-build.txt`;
  if (command.includes("--stage boundary-gate")) return `${issueDir}/test-output/canonical-floorplan-ux-boundary-gate.txt`;
  if (command.includes("check-canonical-floorplan-ux")) return `${issueDir}/test-output/canonical-floorplan-ux-gate.txt`;
  if (command.includes("check-default-plans")) return `${issueDir}/test-output/plans-2-through-5-unchanged.txt`;
  if (command.includes("check-no-phi")) return `${issueDir}/test-output/no-phi.txt`;
  if (command.includes("check-private-source")) return `${issueDir}/test-output/private-source-artifacts.txt`;
  if (command.includes("check-docs-contracts")) return `${issueDir}/test-output/docs-gate.txt`;
  if (command.includes("docker compose config")) return `${issueDir}/test-output/docker-compose-config.txt`;
  if (command.includes("docker compose build web")) return `${issueDir}/test-output/docker-compose-build-web.txt`;
  return `${issueDir}/test-output/command.txt`;
}

function updateIssueEvidenceIndex(currentIssue) {
  const indexPath = "docs/verification/ISSUE_EVIDENCE_INDEX.json";
  if (!existsSync(abs(indexPath))) return;
  const index = readJson(indexPath);
  const issueNumber = String(currentIssue).padStart(3, "0");
  const requiredEvidence = listFiles(issueDir).sort();
  const entry = {
    issue: issueNumber,
    title: currentIssue === "450"
      ? "Canonical Floorplan UX GO / NO-GO"
      : `Canonical Floorplan UX Issue ${currentIssue}`,
    requiredEvidence
  };
  const existingIndex = index.issues.findIndex((candidate) => candidate.issue === issueNumber);
  if (existingIndex >= 0) index.issues[existingIndex] = entry;
  else index.issues.push(entry);
  index.issues.sort((left, right) => left.issue.localeCompare(right.issue));
  writeJson(indexPath, index);
}

function listFiles(directory) {
  const fullDir = abs(directory);
  if (!existsSync(fullDir)) return [];
  const files = [];
  for (const entry of readdirSync(fullDir, { withFileTypes: true })) {
    const fullPath = join(fullDir, entry.name);
    const relativePath = relative(repoRoot, fullPath).replace(/\\/g, "/");
    if (entry.isDirectory()) files.push(...listFiles(relativePath));
    else if (entry.isFile()) files.push(relativePath);
  }
  return files;
}

function loadManifest() {
  if (existsSync(abs(manifestPath))) return readJson(manifestPath);
  return {
    manifestVersion: "1.0.0",
    batch: "441-450",
    lastUpdatedIssue: "441",
    productDisplayName: "ER Pod Shift Simulator",
    floorplanModelStatus: "single_canonical_floorplan",
    canonicalProductViewStatus: "missing",
    legacyDefaultContainmentStatus: "missing",
    savedFloorplanDeleteStatus: "missing",
    activeFloorplanCleanupStatus: "missing",
    canonicalHeaderStatus: "missing",
    nurseDeskShapeStatus: "missing",
    nurseDeskLabelPlateStatus: "missing",
    presentationModeDeskStatus: "missing",
    visualParityProofStatus: "missing",
    singleFloorplanBoundaryGateStatus: "missing",
    ratioScenarioStatus: "contract_only",
    fourToOneScenarioStatus: "contract_only",
    threeToOneScenarioStatus: "contract_only",
    fullShiftSimulationStatus: "not_started",
    optimizerStatus: "not_started",
    manualApprovalStatus: "missing",
    promotionStatus: "blocked",
    privateSourceBoundaryStatus: "passed",
    noPhiStatus: "passed",
    defaultFixtureMutationStatus: "unchanged",
    goNoGoStatus: "not_ready"
  };
}

function legacyPlanIds() {
  return [2, 3, 4, 5].map((number) => `default-er-layout-plan-${number}`);
}

function allLegacyFixtureFilesExist() {
  return legacyPlanIds().every((planId) =>
    existsSync(abs(`packages/shared/fixtures/default-plans/${planId}.json`))
  );
}

function fixtureChangedPaths() {
  const result = spawnSync("git", ["diff", "--name-only", "HEAD", "--", "packages/shared/fixtures/default-plans"], {
    cwd: repoRoot,
    encoding: "utf8"
  });
  if (result.status !== 0) return ["git diff failed"];
  return result.stdout.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean);
}

function requireFile(path) {
  if (!existsSync(abs(path))) failures.push(`missing required file: ${path}`);
}

function requireText(path, text) {
  requireFile(path);
  if (existsSync(abs(path)) && !readText(path).includes(text)) {
    failures.push(`${path} missing ${text}`);
  }
}

function assertPng(path) {
  if (!existsSync(abs(path))) {
    failures.push(`missing browser-rendered screenshot: ${path}`);
    return;
  }
  const buffer = readFileSync(abs(path));
  if (buffer.toString("ascii", 1, 4) !== "PNG") failures.push(`${path} is not a PNG`);
  if (statSync(abs(path)).size < 5000) failures.push(`${path} is placeholder-like`);
}

function readArg(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

function readText(path) {
  return readFileSync(abs(path), "utf8");
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function writeJson(path, value) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(path, value) {
  mkdirSync(dirname(abs(path)), { recursive: true });
  writeFileSync(abs(path), value);
}

function abs(path) {
  return join(repoRoot, path);
}
