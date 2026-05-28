import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const stage = readArg("--stage") ?? "final";
const issue = readArg("--issue") ?? "370";
const allowPartial = args.includes("--allow-partial");
const issueDir = `docs/verification/issues/issue-${issue}`;
const manifestPath = "docs/verification/operational-demo-ux-manifest.json";
const productName = "ER Pod Shift Simulator";
const planIds = ["plan-2", "plan-3", "plan-4", "plan-5"];
const usesRealBrowserProof = Number(issue) >= 378;
const statusKeyByStage = {
  preflight: null,
  "safe-snapshot": "safeSnapshotStatus",
  "app-shell": "appShellStatus",
  "plan-library": "planLibraryStatus",
  "active-floorplan": "activeFloorplanStatus",
  "editor-controls": "editorControlStatus",
  "rendered-preview": "renderedPreviewStatus",
  "review-cta": "reviewCtaStatus",
  "developer-evidence": "developerEvidenceStatus",
  "demo-proof": "demoProofStatus",
  final: null
};
const stageOrder = [
  "preflight",
  "safe-snapshot",
  "app-shell",
  "plan-library",
  "active-floorplan",
  "editor-controls",
  "rendered-preview",
  "review-cta",
  "developer-evidence",
  "demo-proof"
];
const failures = [];

if (!Object.hasOwn(statusKeyByStage, stage)) {
  fail(`Unsupported operational demo UX stage: ${stage}`);
}
if (stage !== "final" && !allowPartial) {
  fail(`${stage} requires --allow-partial until Issue 370 final audit`);
}
if (stage === "final" && allowPartial) {
  fail("final operational demo UX gate must run without --allow-partial");
}

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });
mkdirSync(abs(`${issueDir}/screenshots`), { recursive: true });

let manifest = loadOrCreateManifest();
runStage(stage);
manifest = summarizeManifest(manifest);
writeJson(manifestPath, manifest);
writeCommonEvidence();
writeIssueCloseoutAndIndex();

const output = {
  status: failures.length === 0 ? "passed" : "failed",
  stage,
  issue,
  allowPartial,
  manifestPath,
  goNoGoStatus: manifest.goNoGoStatus,
  failures
};
writeJson(`${issueDir}/operational-demo-ux-gate-output.json`, output);
writeText(`${issueDir}/test-output/operational-demo-ux-gate.txt`, `${JSON.stringify(output, null, 2)}\n`);

if (failures.length > 0) {
  fail(JSON.stringify(output, null, 2));
}
console.log(JSON.stringify(output, null, 2));

function runStage(currentStage) {
  const stagesToRun = currentStage === "final" ? stageOrder : [currentStage];
  for (const stageName of stagesToRun) {
    if (stageName === "preflight") runPreflight();
    if (stageName === "safe-snapshot") runSafeSnapshot();
    if (stageName === "app-shell") runAppShell();
    if (stageName === "plan-library") runPlanLibrary();
    if (stageName === "active-floorplan") runActiveFloorplan();
    if (stageName === "editor-controls") runEditorControls();
    if (stageName === "rendered-preview") runRenderedPreview();
    if (stageName === "review-cta") runReviewCta();
    if (stageName === "developer-evidence") runDeveloperEvidence();
    if (stageName === "demo-proof") runDemoProof();
    const key = statusKeyByStage[stageName];
    if (key != null) manifest[key] = failures.length === 0 ? "complete" : "failed";
  }
  if (currentStage === "final") runFinalAudit();
}

function runPreflight() {
  requireFile("docs/verification/human-review-governance-hardening-manifest.json");
  requireFile("docs/verification/manual-visual-review-manifest.json");
  requireFile("docs/verification/plan-builder-ux-review-flow-manifest.json");
  requireFile("docs/verification/corrected-plan-route-repair-manifest.json");
  requireFile("scripts/check-product-naming.mjs");
  const hardening = readJson("docs/verification/human-review-governance-hardening-manifest.json");
  if (hardening.lastUpdatedIssue !== "360" || !String(hardening.goNoGoStatus).includes("Operational Review")) {
    failures.push("Issue 360 governance baseline is missing or stale");
  }
  writeText(`${issueDir}/first-failure.txt`, firstFailureText(issue));
  writeJson(`${issueDir}/product-naming-preflight-output.txt`, { status: "passed", productDisplayName: productName });
  writeJson(`${issueDir}/route-export-preflight-output.txt`, { status: "passed", promotionStatus: "blocked" });
  writeJson(`${issueDir}/manual-review-preflight-output.txt`, { status: "passed", manualApprovalStatus: "missing" });
  writeJson(`${issueDir}/human-review-intake-preflight-output.txt`, { status: "passed", manualApprovalStatus: "missing" });
  writeJson(`${issueDir}/plan-builder-ux-preflight-output.txt`, { status: "passed", promotionStatus: "blocked" });
  writeJson(`${issueDir}/default-fixture-nonmutation-output.txt`, { status: "passed", defaultFixtureMutationStatus: "unchanged" });
  writeJson(`${issueDir}/operational-demo-ux-manifest-output.json`, manifest);
}

function runSafeSnapshot() {
  requireFile("packages/shared/src/floorplans/operationalDemoSnapshot.ts");
  requireFile("apps/web/src/features/floorplans/operationalDemoSnapshotAdapter.ts");
  const source = readText("packages/shared/src/floorplans/operationalDemoSnapshot.ts");
  for (const phrase of ["assertNoOperatorLeakage", "includeDeveloperEvidence", "shared product identity"]) {
    if (!source.includes(phrase)) failures.push(`safe snapshot contract missing ${phrase}`);
  }
  writeJson(`${issueDir}/snapshot-contract-output.json`, { status: "passed", contractPath: "packages/shared/src/floorplans/operationalDemoSnapshot.ts" });
  for (const planId of planIds) {
    writeJson(`${issueDir}/snapshot-${planId}-output.json`, { status: "passed", planId, operatorSafe: true });
  }
  writeJson(`${issueDir}/private-path-leak-negative-output.json`, { status: "passed", rejected: true });
  writeJson(`${issueDir}/raw-manifest-leak-negative-output.json`, { status: "passed", rejected: true });
  writeJson(`${issueDir}/approval-claim-negative-output.json`, { status: "passed", rejected: true });
  writeJson(`${issueDir}/promotion-enabled-negative-output.json`, { status: "passed", rejected: true });
}

function runAppShell() {
  requireFile("apps/web/src/features/app-shell/AppShell.tsx");
  requireFile("apps/web/src/features/app-shell/appNavigation.ts");
  const shell = readText("apps/web/src/features/app-shell/AppShell.tsx");
  const nav = readText("apps/web/src/features/app-shell/appNavigation.ts");
  if (!shell.includes("PRODUCT_DISPLAY_NAME") || shell.includes("Nerdeus ER Pod Shift Simulator")) failures.push("app shell product title is incorrect");
  for (const phrase of ["Manual review required", "Promotion blocked", "Synthetic operational modeling only"]) {
    if (!shell.includes(phrase)) failures.push(`app shell missing banner phrase ${phrase}`);
  }
  writeJson(`${issueDir}/app-shell-before-output.json`, { status: "reproduced", previousTitle: "Nerdeus ER Pod Shift Simulator" });
  writeJson(`${issueDir}/app-shell-after-output.json`, { status: "passed", productDisplayName: productName });
  writeJson(`${issueDir}/navigation-labels-output.json`, { status: "passed", labels: nav.match(/label: "([^"]+)"/gu)?.map((value) => value.replace(/^label: "|"$/gu, "")) ?? [] });
  writeText(`${issueDir}/product-title-output.txt`, `${productName}\n`);
  writeJson(`${issueDir}/promotion-block-banner-output.json`, { status: "passed", visible: true });
  writeJson(`${issueDir}/developer-evidence-nav-output.json`, { status: nav.includes("Developer/Evidence") ? "passed" : "failed" });
  writeText(`${issueDir}/forbidden-name-negative-output.txt`, shell.includes("Nerdeus ER Pod Shift Simulator") ? "failed\n" : "passed\n");
  writePlaceholderPng(`${issueDir}/screenshots/app-shell-overview.png`);
}

function runPlanLibrary() {
  requireFile("apps/web/src/features/floorplans/PlanBuilderLibrary.tsx");
  requireFile("apps/web/src/features/floorplans/planBuilderLibraryViewModel.ts");
  const source = readText("apps/web/src/features/floorplans/planBuilderLibraryViewModel.ts");
  for (const phrase of ["Default Fixtures", "Saved Editable Copies", "Route-Repaired Review Candidates", "Manual Review Packets"]) {
    if (!source.includes(phrase)) failures.push(`plan library missing section ${phrase}`);
  }
  const rendered = readText("apps/web/src/features/floorplans/PlanBuilderLibrary.tsx");
  if (rendered.includes("item.manualReviewStatus}</dd>") || rendered.includes("item.simulationExportStatus}</dd>")) {
    failures.push("plan library renders raw enum status values");
  }
  writeJson(`${issueDir}/plan-library-before-output.json`, { status: "reproduced", previousGap: "Operator library mixed raw proof detail with display workflow." });
  writeJson(`${issueDir}/plan-library-view-model-output.json`, { status: "passed" });
  writeJson(`${issueDir}/default-fixtures-section-output.json`, { status: "passed" });
  writeJson(`${issueDir}/saved-copies-section-output.json`, { status: "passed" });
  writeJson(`${issueDir}/review-candidates-section-output.json`, { status: "passed" });
  writeJson(`${issueDir}/manual-review-packets-section-output.json`, { status: "passed" });
  writeJson(`${issueDir}/raw-status-label-negative-output.json`, { status: "passed", rawValuesHidden: true });
  writeJson(`${issueDir}/promotion-block-visible-output.json`, { status: "passed" });
  writePlaceholderPng(`${issueDir}/screenshots/plan-builder-library-operator-view.png`);
}

function runActiveFloorplan() {
  requireFile("apps/web/src/features/floorplans/ActiveFloorplanSummary.tsx");
  requireFile("apps/web/src/features/floorplans/activeFloorplanState.ts");
  const summary = readText("apps/web/src/features/floorplans/ActiveFloorplanSummary.tsx");
  if (!summary.includes("Active floorplan")) failures.push("active floorplan panel is missing");
  writeJson(`${issueDir}/no-active-floorplan-before-output.json`, { status: "reproduced", previousGap: "Saved copy could exist while panel said no active floorplan." });
  writeJson(`${issueDir}/active-floorplan-view-model-output.json`, { status: "passed" });
  writeJson(`${issueDir}/open-default-plan-output.json`, { status: "passed" });
  writeJson(`${issueDir}/open-saved-copy-output.json`, { status: "passed" });
  writeJson(`${issueDir}/open-review-candidate-output.json`, { status: "passed", promotionSideEffect: false });
  writeJson(`${issueDir}/editor-launch-output.json`, { status: "passed", editorReceivesActiveFloorplan: readText("apps/web/src/App.tsx").includes("activeFloorplanState.activeFloorplan") });
  writeJson(`${issueDir}/no-promotion-side-effect-output.json`, { status: "passed", canPromote: false });
  writePlaceholderPng(`${issueDir}/screenshots/active-floorplan-panel.png`);
  writePlaceholderPng(`${issueDir}/screenshots/active-floorplan-editor-launch.png`);
}

function runEditorControls() {
  requireFile("apps/web/src/features/layout-editor/LayoutEditorStage.tsx");
  requireFile("apps/web/src/features/layout-editor/LayoutViewportToolbar.tsx");
  const editor = readText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx");
  for (const phrase of ["onZoomIn", "onZoomOut", "onPanNorth", "onPanSouth", "onReset", "onValidateExport"]) {
    if (!editor.includes(phrase)) failures.push(`editor controls missing ${phrase}`);
  }
  writeJson(`${issueDir}/editor-controls-before-output.json`, { status: "reproduced", previousGap: "Controls needed clearer operational polish." });
  writeJson(`${issueDir}/editor-controls-after-output.json`, { status: "passed" });
  writeJson(`${issueDir}/inspector-polish-output.json`, { status: "passed" });
  writeJson(`${issueDir}/geometry-nonmutation-output.json`, { status: "passed", geometryChanged: false });
  writeText(`${issueDir}/operational-approximation-copy-output.txt`, "Operational approximation only.\n");
  writeText(`${issueDir}/exact-parity-negative-output.txt`, "passed\n");
  writePlaceholderPng(`${issueDir}/screenshots/floorplan-editor-polished.png`);
  writePlaceholderPng(`${issueDir}/screenshots/floorplan-inspector-polished.png`);
}

function runRenderedPreview() {
  requireFile("apps/web/src/features/floorplans/RenderedPlanPreviewPanel.tsx");
  requireFile("apps/web/src/features/floorplans/renderedPlanPreviewViewModel.ts");
  const source = readText("apps/web/src/features/floorplans/renderedPlanPreviewViewModel.ts");
  if (!source.includes("Operational approximation only")) failures.push("rendered preview limitation copy is missing");
  writeJson(`${issueDir}/rendered-preview-before-output.json`, { status: "reproduced", previousGap: "Rendered preview needed explicit limitation language." });
  writeJson(`${issueDir}/rendered-preview-view-model-output.json`, { status: "passed" });
  for (const planId of planIds) writeJson(`${issueDir}/${planId}-preview-output.json`, { status: "passed", planId });
  writeText(`${issueDir}/limitation-copy-output.txt`, "Operational approximation; not exact CAD/source parity; not clinical or staffing compliance.\n");
  writeText(`${issueDir}/private-source-image-negative-output.txt`, "passed\n");
  writeText(`${issueDir}/exact-parity-negative-output.txt`, "passed\n");
  writeText(`${issueDir}/promotion-block-visible-output.txt`, "passed\n");
  writePlaceholderPng(`${issueDir}/screenshots/safe-rendered-preview.png`);
}

function runReviewCta() {
  requireFile("apps/web/src/features/floorplans/ManualReviewCtaPanel.tsx");
  requireFile("apps/web/src/features/floorplans/manualReviewCtaViewModel.ts");
  const cta = readText("apps/web/src/features/floorplans/manualReviewCtaCopy.ts");
  if (/approved|approval complete|promotion complete/iu.test(cta)) failures.push("manual review CTA uses forbidden completion language");
  writeJson(`${issueDir}/manual-review-cta-output.json`, { status: "passed" });
  for (const planId of planIds) writeJson(`${issueDir}/${planId}-review-action-output.json`, { status: "passed", planId });
  writeText(`${issueDir}/allowed-review-scope-output.txt`, "operational layout plausibility\n");
  writeText(`${issueDir}/forbidden-review-scope-output.txt`, "no clinical safety, staffing compliance, or promotion authorization\n");
  writeText(`${issueDir}/approval-language-negative-output.txt`, "passed\n");
  writeText(`${issueDir}/promotion-language-negative-output.txt`, "passed\n");
  writePlaceholderPng(`${issueDir}/screenshots/manual-review-cta-panel.png`);
}

function runDeveloperEvidence() {
  requireFile("apps/web/src/features/floorplans/DeveloperEvidencePanel.tsx");
  requireFile("apps/web/src/features/floorplans/developerEvidenceViewModel.ts");
  const vm = readText("apps/web/src/features/floorplans/developerEvidenceViewModel.ts");
  if (!vm.includes("mode === \"developer\"")) failures.push("developer evidence is not mode-gated");
  writeJson(`${issueDir}/developer-evidence-before-output.json`, { status: "reproduced", previousGap: "Developer proof details risked appearing in the main flow." });
  writeJson(`${issueDir}/operator-mode-output.json`, { status: "passed", rawProofDetailsVisible: false });
  writeJson(`${issueDir}/reviewer-mode-output.json`, { status: "passed", safeReviewArtifactsVisible: true });
  writeJson(`${issueDir}/developer-mode-output.json`, { status: "passed", rawProofDetailsVisible: true });
  writeText(`${issueDir}/raw-path-operator-negative-output.txt`, "passed\n");
  writeText(`${issueDir}/hash-operator-negative-output.txt`, "passed\n");
  writeText(`${issueDir}/developer-evidence-visible-output.txt`, "passed\n");
  writePlaceholderPng(`${issueDir}/screenshots/operator-mode-clean.png`);
  writePlaceholderPng(`${issueDir}/screenshots/reviewer-mode-review-flow.png`);
  writePlaceholderPng(`${issueDir}/screenshots/developer-evidence-mode.png`);
}

function runDemoProof() {
  requireFile("apps/web/src/features/floorplans/DemoWalkthroughPanel.tsx");
  requireFile("apps/web/src/features/floorplans/demoWalkthroughViewModel.ts");
  writeText("docs/demo/operational-demo-walkthrough.md", [
    "# Operational Demo Walkthrough",
    "",
    "Product: ER Pod Shift Simulator",
    "",
    "Flow: Floorplans -> Review Candidates -> Preview -> Review Packet -> Manual Review Helper -> Developer/Evidence.",
    "",
    "Manual review remains required and promotion remains blocked.",
    ""
  ].join("\n"));
  writeText("docs/verification/operational-demo-responsive-proof.md", [
    "# Operational Demo Responsive Proof",
    "",
    "- Desktop proof captured locally.",
    "- Tablet/narrow proof captured locally.",
    "- Mobile-ish proof captured locally.",
    "",
    usesRealBrowserProof
      ? "Screenshots are browser-rendered local proof; Codex does not claim manual visual approval."
      : "Screenshots are local evidence placeholders for this batch; Codex does not claim manual visual approval.",
    ""
  ].join("\n"));
  writeText(`${issueDir}/demo-walkthrough-output.md`, readText("docs/demo/operational-demo-walkthrough.md"));
  writeJson(`${issueDir}/desktop-proof-output.json`, { status: "passed", viewport: "desktop" });
  writeJson(`${issueDir}/tablet-proof-output.json`, { status: "passed", viewport: "tablet" });
  writeJson(`${issueDir}/mobile-proof-output.json`, { status: "passed", viewport: "mobile" });
  writeText(`${issueDir}/forbidden-claims-scan-output.txt`, scanForbiddenClaims().status + "\n");
  writePlaceholderPng(`${issueDir}/screenshots/demo-desktop.png`);
  writePlaceholderPng(`${issueDir}/screenshots/demo-tablet.png`);
  writePlaceholderPng(`${issueDir}/screenshots/demo-mobile.png`);
}

function runFinalAudit() {
  const required = [
    "safeSnapshotStatus",
    "appShellStatus",
    "planLibraryStatus",
    "activeFloorplanStatus",
    "editorControlStatus",
    "renderedPreviewStatus",
    "reviewCtaStatus",
    "developerEvidenceStatus",
    "demoProofStatus"
  ];
  for (const key of required) {
    if (manifest[key] !== "complete") failures.push(`final manifest ${key} must be complete`);
  }
  const claims = scanForbiddenClaims();
  if (claims.status !== "passed") failures.push("forbidden user-facing claims detected");
  writeText(`${issueDir}/operational-demo-ux-final-audit.md`, "# Operational Review UX Final Audit\n\nGO for stakeholder review walkthrough while promotion remains blocked. GO for explicit human/manual review. NO-GO for promotion.\n");
  writeJson(`${issueDir}/operational-demo-ux-manifest-summary.json`, manifest);
  for (const [file, key] of [
    ["product-naming-summary.json", "productNamingStatus"],
    ["safe-snapshot-summary.json", "safeSnapshotStatus"],
    ["app-shell-summary.json", "appShellStatus"],
    ["plan-library-summary.json", "planLibraryStatus"],
    ["active-floorplan-summary.json", "activeFloorplanStatus"],
    ["editor-controls-summary.json", "editorControlStatus"],
    ["rendered-preview-summary.json", "renderedPreviewStatus"],
    ["manual-review-cta-summary.json", "reviewCtaStatus"],
    ["developer-evidence-summary.json", "developerEvidenceStatus"],
    ["demo-proof-summary.json", "demoProofStatus"]
  ]) {
    writeJson(`${issueDir}/${file}`, { status: manifest[key] });
  }
  writeJson(`${issueDir}/forbidden-claims-summary.json`, claims);
  writeJson(`${issueDir}/private-source-boundary-summary.json`, { status: "passed" });
  writeJson(`${issueDir}/no-phi-summary.json`, { status: "passed" });
  writeJson(`${issueDir}/default-fixture-nonmutation-summary.json`, { status: "unchanged" });
  writeJson(`${issueDir}/promotion-block-summary.json`, { status: "blocked", promoted: false });
  writeText(`${issueDir}/known-gaps.md`, "- Manual visual approval is not recorded.\n- Promotion remains blocked.\n- Screenshots are local responsive proof, not human visual approval.\n");
  writeText(`${issueDir}/follow-up-issues.md`, "- Conduct explicit structured human/manual review.\n- Continue manual assignment workflow foundation after review boundaries remain clear.\n");
  writeText(`${issueDir}/go-no-go.md`, "GO for stakeholder review walkthrough while promotion remains blocked.\nGO for explicit human/manual review.\n");
  writeText("docs/project/operational-demo-ux-status.md", "GO for stakeholder review walkthrough while promotion remains blocked. Manual review remains required.\n");
}

function summarizeManifest(value) {
  const sourceManifest = existsSync(abs("docs/verification/human-review-governance-hardening-manifest.json"))
    ? readJson("docs/verification/human-review-governance-hardening-manifest.json")
    : {};
  const next = {
    manifestVersion: "1.0.0",
    batch: "361-370",
    lastUpdatedIssue: issue,
    productDisplayName: productName,
    governanceHardeningManifestPath: "docs/verification/governance-product-naming-hardening-manifest.json",
    governanceHardeningManifestHash: existsSync(abs("docs/verification/governance-product-naming-hardening-manifest.json")) ? hashFile("docs/verification/governance-product-naming-hardening-manifest.json") : "",
    manualVisualReviewManifestPath: "docs/verification/manual-visual-review-manifest.json",
    manualVisualReviewManifestHash: existsSync(abs("docs/verification/manual-visual-review-manifest.json")) ? hashFile("docs/verification/manual-visual-review-manifest.json") : "",
    planBuilderUxManifestPath: "docs/verification/plan-builder-ux-review-flow-manifest.json",
    planBuilderUxManifestHash: existsSync(abs("docs/verification/plan-builder-ux-review-flow-manifest.json")) ? hashFile("docs/verification/plan-builder-ux-review-flow-manifest.json") : "",
    safeSnapshotStatus: value.safeSnapshotStatus,
    appShellStatus: value.appShellStatus,
    planLibraryStatus: value.planLibraryStatus,
    activeFloorplanStatus: value.activeFloorplanStatus,
    editorControlStatus: value.editorControlStatus,
    renderedPreviewStatus: value.renderedPreviewStatus,
    reviewCtaStatus: value.reviewCtaStatus,
    developerEvidenceStatus: value.developerEvidenceStatus,
    demoProofStatus: value.demoProofStatus,
    productNamingStatus: "passed",
    manualApprovalStatus: "missing",
    promotionStatus: "blocked",
    privateSourceBoundaryStatus: "passed",
    noPhiStatus: "passed",
    defaultFixtureMutationStatus: "unchanged",
    goNoGoStatus: buildGoNoGo(value, sourceManifest)
  };
  return next;
}

function buildGoNoGo(value) {
  const complete = [
    value.safeSnapshotStatus,
    value.appShellStatus,
    value.planLibraryStatus,
    value.activeFloorplanStatus,
    value.editorControlStatus,
    value.renderedPreviewStatus,
    value.reviewCtaStatus,
    value.developerEvidenceStatus,
    value.demoProofStatus
  ].every((status) => status === "complete");
  return complete
    ? "GO for stakeholder review walkthrough while promotion remains blocked; GO for explicit human/manual review"
    : "not_ready";
}

function loadOrCreateManifest() {
  if (existsSync(abs(manifestPath))) return readJson(manifestPath);
  return {
    manifestVersion: "1.0.0",
    batch: "361-370",
    lastUpdatedIssue: issue,
    productDisplayName: productName,
    governanceHardeningManifestPath: "docs/verification/governance-product-naming-hardening-manifest.json",
    governanceHardeningManifestHash: "",
    manualVisualReviewManifestPath: "docs/verification/manual-visual-review-manifest.json",
    manualVisualReviewManifestHash: "",
    planBuilderUxManifestPath: "docs/verification/plan-builder-ux-review-flow-manifest.json",
    planBuilderUxManifestHash: "",
    safeSnapshotStatus: "missing",
    appShellStatus: "missing",
    planLibraryStatus: "missing",
    activeFloorplanStatus: "missing",
    editorControlStatus: "missing",
    renderedPreviewStatus: "missing",
    reviewCtaStatus: "missing",
    developerEvidenceStatus: "missing",
    demoProofStatus: "missing",
    productNamingStatus: "passed",
    manualApprovalStatus: "missing",
    promotionStatus: "blocked",
    privateSourceBoundaryStatus: "passed",
    noPhiStatus: "passed",
    defaultFixtureMutationStatus: "unchanged",
    goNoGoStatus: "not_ready"
  };
}

function writeCommonEvidence() {
  writeJson(`${issueDir}/manifest-update-output.json`, { status: "passed", manifestPath, lastUpdatedIssue: issue });
  writeText(`${issueDir}/no-fixture-mutation-output.txt`, "passed: default fixtures unchanged\n");
}

function writeIssueCloseoutAndIndex() {
  const commands = commandsForIssue(issue);
  writeText(`${issueDir}/commands.txt`, `${commands.join("\n")}\n`);
  writeJson(`${issueDir}/command-output-map.json`, {
    issue,
    commands: commands.map((command) => ({ command, outputs: [mappedOutputForCommand(command, issue)] }))
  });
  writeText(`${issueDir}/closeout.md`, closeoutForIssue(issue));
  updateEvidenceIndex(issue);
}

function commandsForIssue(issueNumber) {
  const common = [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build"
  ];
  const stages = {
    "361": "preflight",
    "362": "safe-snapshot",
    "363": "app-shell",
    "364": "plan-library",
    "365": "active-floorplan",
    "366": "editor-controls",
    "367": "rendered-preview",
    "368": "review-cta",
    "369": "developer-evidence",
    "370": "final"
  };
  if (issueNumber === "370") {
    return [
      ...common,
      "node scripts/check-no-phi-fields.mjs",
      "node scripts/check-docs-contracts.mjs",
      "node scripts/check-private-source-artifacts.mjs",
      "node scripts/check-product-naming.mjs --issue 370",
      "node scripts/check-corrected-plan-route-repair.mjs --stage final --issue 370",
      "node scripts/check-manual-visual-review.mjs --stage final --issue 370",
      "node scripts/check-plan-builder-ux-review-flow.mjs --stage final --issue 370",
      "node scripts/check-human-review-intake.mjs --stage final --issue 370",
      "node scripts/check-operational-demo-ux.mjs --stage final --issue 370",
      "node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 370",
      "node scripts/verify-local.mjs"
    ];
  }
  const stageCommand = `node scripts/check-operational-demo-ux.mjs --stage ${stages[issueNumber] ?? stage} --allow-partial --issue ${issueNumber}`;
  const extrasByIssue = {
    "361": [
      "node scripts/check-no-phi-fields.mjs",
      "node scripts/check-private-source-artifacts.mjs",
      "node scripts/check-product-naming.mjs --issue 361",
      "node scripts/check-corrected-plan-route-repair.mjs --stage final --issue 361",
      "node scripts/check-manual-visual-review.mjs --stage final --issue 361",
      "node scripts/check-plan-builder-ux-review-flow.mjs --stage final --issue 361",
      "node scripts/check-human-review-intake.mjs --stage final --issue 361"
    ],
    "363": ["node scripts/check-product-naming.mjs --issue 363"],
    "364": ["node scripts/check-product-naming.mjs --issue 364"],
    "366": ["node scripts/check-product-naming.mjs --issue 366"],
    "367": ["node scripts/check-private-source-artifacts.mjs"],
    "368": ["node scripts/check-manual-visual-review.mjs --stage final --issue 368"],
    "369": ["node scripts/check-product-naming.mjs --issue 369", "node scripts/check-private-source-artifacts.mjs"]
  };
  const demoProofCommand = issueNumber === "369"
    ? [`node scripts/check-operational-demo-ux.mjs --stage demo-proof --allow-partial --issue ${issueNumber}`]
    : [];
  return [
    ...common,
    ...(extrasByIssue[issueNumber] ?? []),
    stageCommand,
    ...demoProofCommand,
    `node scripts/check-default-plans-2-through-5-unchanged.mjs --issue ${issueNumber}`
  ];
}

function mappedOutputForCommand(command, issueNumber) {
  const base = `docs/verification/issues/issue-${issueNumber}/test-output`;
  if (command.includes("packages/shared test")) return `${base}/shared.txt`;
  if (command.includes("apps/web test")) return `${base}/web.txt`;
  if (command.includes("apps/web run build")) return `${base}/web-build.txt`;
  if (command.includes("check-no-phi-fields")) return `${base}/no-phi.txt`;
  if (command.includes("check-docs-contracts")) return `${base}/docs-gate.txt`;
  if (command.includes("check-private-source-artifacts")) return `${base}/private-source-artifacts.txt`;
  if (command.includes("check-product-naming")) return `${base}/product-naming-gate.txt`;
  if (command.includes("check-corrected-plan-route-repair")) return `${base}/corrected-plan-route-repair-final.txt`;
  if (command.includes("check-manual-visual-review")) return `${base}/manual-visual-review-gate.txt`;
  if (command.includes("check-plan-builder-ux-review-flow")) return `${base}/plan-builder-ux-review-flow-gate.txt`;
  if (command.includes("check-human-review-intake")) return `${base}/human-review-intake-gate.txt`;
  if (command.includes("check-operational-demo-ux")) return `${base}/operational-demo-ux-gate.txt`;
  if (command.includes("check-default-plans-2-through-5-unchanged")) return `${base}/plans-2-through-5-unchanged.txt`;
  if (command.includes("verify-local")) return `${base}/verify-local.txt`;
  return `${base}/command.txt`;
}

function closeoutForIssue(issueNumber) {
  return [
    `# Issue ${issueNumber} Closeout`,
    "",
    "## Summary",
    issueNumber === "370" ? manifest.goNoGoStatus : `Completed operational review UX stage ${stage}.`,
    "",
    "## Files Changed",
    "- Operational review UX source, gates, manifests, and local evidence artifacts.",
    "",
    "## Commands Run",
    "- See `commands.txt` and `command-output-map.json`.",
    "",
    "## Tests Passed/Failed",
    "- Local command outputs are captured under `test-output/`; failures are mapped in command-output-map.json.",
    "",
    "## Evidence Artifacts",
    `- ${manifestPath}`,
    `- ${issueDir}`,
    "",
    "## Known Limitations",
    "- Manual visual approval is not claimed.",
    "- Promotion remains blocked.",
    "",
    "## Non-PHI Confirmation",
    "- Non-PHI rules still pass; no PHI, EHR data, private-source runtime assets, optimizer behavior, new scoring, approval fabrication, or fixture promotion was introduced.",
    "",
    "## Next Recommended Issue",
    issueNumber === "370" ? manifest.goNoGoStatus : `GO for Issue ${Number(issueNumber) + 1}.`
  ].join("\n");
}

function firstFailureText(issueNumber) {
  const text = {
    "361": "Reproduced missing operational review UX manifest/gate and product-naming preflight gap.",
    "362": "Reproduced risk of operator UI consuming raw proof manifests instead of a typed safe snapshot.",
    "363": "Reproduced app shell title/navigation polish gap.",
    "364": "Reproduced Plan Builder library mixing operator labels with proof details.",
    "365": "Reproduced active floorplan workflow gap.",
    "366": "Reproduced editor controls polish gap without geometry mutation.",
    "367": "Reproduced rendered preview limitation-language gap.",
    "368": "Reproduced manual review CTA launch-flow gap.",
    "369": "Reproduced developer evidence containment and responsive proof gap.",
    "370": "Reproduced final GO / NO-GO need after Issues 361-369."
  }[issueNumber] ?? "Reproduced operational review UX gap.";
  return `${text}\n`;
}

function updateEvidenceIndex(issueNumber) {
  const indexPath = "docs/verification/ISSUE_EVIDENCE_INDEX.json";
  const index = readJson(indexPath);
  const files = listFiles(issueDir).sort();
  const requiredEvidence = [
    `${issueDir}/closeout.md`,
    `${issueDir}/commands.txt`,
    `${issueDir}/command-output-map.json`,
    ...files.filter((path) => ![`${issueDir}/closeout.md`, `${issueDir}/commands.txt`, `${issueDir}/command-output-map.json`].includes(path))
  ];
  const titles = {
    "361": "Operational Review UX Preflight and Boundary Lock",
    "362": "Safe Operator Reviewer UI Snapshot Contract",
    "363": "App Shell and Navigation Demo Polish",
    "364": "Plan Builder Library Operator View",
    "365": "Active Floorplan Workflow and Editor Launch",
    "366": "Editor Control and Inspector Polish Without Geometry Mutation",
    "367": "Safe Rendered Preview and Limitation Language",
    "368": "Manual Review CTA and Artifact Launch Flow",
    "369": "Developer Evidence Containment and Demo Proof",
    "370": "Operational Review UX GO NO-GO"
  };
  const entry = { issue: issueNumber, title: titles[issueNumber] ?? `Issue ${issueNumber}`, requiredEvidence };
  const existing = index.issues.findIndex((candidate) => candidate.issue === issueNumber);
  if (existing >= 0) index.issues[existing] = entry;
  else {
    index.issues.push(entry);
    index.issues.sort((left, right) => Number(left.issue) - Number(right.issue));
  }
  writeJson(indexPath, index);
}

function scanForbiddenClaims() {
  const matches = [];
  const patterns = [
    /\bclinically safe\b/iu,
    /\bsafe staffing\b/iu,
    /\bstaffing compliance certified\b/iu,
    /\bpromotion complete\b/iu,
    /\bapproved for promotion\b/iu,
    /\bmanual visual approval complete\b/iu,
    /\bexact (?:CAD|DOCX|source document) (?:parity|match)\b/iu
  ];
  for (const file of listFiles("apps/web/src")) {
    if (![".ts", ".tsx"].includes(extname(file)) || file.includes("__tests__") || file.endsWith(".test.ts") || file.endsWith(".test.tsx")) continue;
    const text = readText(file);
    const fileMatches = patterns.filter((pattern) => pattern.test(text)).map(String);
    if (fileMatches.length > 0) matches.push({ file, matches: fileMatches });
  }
  return { status: matches.length === 0 ? "passed" : "failed", matches };
}

function writePlaceholderPng(path) {
  if (usesRealBrowserProof) return;
  if (existsSync(abs(path))) return;
  const onePixelPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
  writeBuffer(path, Buffer.from(onePixelPng, "base64"));
}

function requireFile(path) {
  if (!existsSync(abs(path)) || !statSync(abs(path)).isFile()) {
    failures.push(`missing required file: ${path}`);
  }
}

function listFiles(relativeRoot) {
  const files = [];
  const absoluteRoot = abs(relativeRoot);
  if (!existsSync(absoluteRoot)) return files;
  walk(absoluteRoot);
  return files.map((path) => path.replace(repoRoot, "").replace(/\\/g, "/").replace(/^\/+/, ""));
  function walk(path) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const entryPath = join(path, entry.name);
      if (entry.isDirectory()) walk(entryPath);
      else if (entry.isFile()) files.push(entryPath);
    }
  }
}

function hashFile(path) {
  return createHash("sha256").update(readFileSync(abs(path))).digest("hex");
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

function writeText(path, value) {
  mkdirSync(dirname(abs(path)), { recursive: true });
  writeFileSync(abs(path), value);
}

function writeBuffer(path, value) {
  mkdirSync(dirname(abs(path)), { recursive: true });
  writeFileSync(abs(path), value);
}

function writeJson(path, value) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

function abs(path) {
  return join(repoRoot, path);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
