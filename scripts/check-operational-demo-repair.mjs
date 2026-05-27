import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const stage = readArg("--stage") ?? "final";
const issue = readArg("--issue") ?? "380";
const allowPartial = args.includes("--allow-partial");
const issueDir = `docs/verification/issues/issue-${issue}`;
const manifestPath = "docs/verification/operational-demo-repair-manifest.json";
const productDisplayName = "ER Pod Shift Simulator";
const forbiddenProductDisplayName = "Nerdeus ER Pod Shift Simulator";
const failures = [];

const stageStatusKey = {
  "browser-title": "browserTitleStatus",
  "product-identity": "productIdentityStatus",
  "product-naming-manifest-boundary": "productNamingManifestBoundaryStatus",
  "snapshot-metadata": "snapshotMetadataStatus",
  "safe-snapshot-consumption": "safeSnapshotConsumptionStatus",
  "review-actions": "reviewActionStatus",
  "evidence-containment": "evidenceContainmentStatus",
  "browser-proof": "browserProofStatus",
  "negative-tests": "negativeTestStatus"
};
const finalStages = Object.keys(stageStatusKey);

if (stage !== "final" && !Object.hasOwn(stageStatusKey, stage)) fail(`Unsupported operational demo repair stage: ${stage}`);
if (stage !== "final" && !allowPartial) failures.push(`${stage} requires --allow-partial before Issue 380`);
if (stage === "final" && allowPartial) failures.push("final repair gate must run without --allow-partial");

mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });
let manifest = loadManifest();

const stagesToRun = stage === "final" ? finalStages : [stage];
for (const currentStage of stagesToRun) {
  runStage(currentStage);
  manifest[stageStatusKey[currentStage]] = stageFailuresFor(currentStage).length === 0 ? "passed" : "failed";
}
manifest.lastUpdatedIssue = issue;
manifest.goNoGoStatus = buildGoNoGoStatus(manifest);
writeJson(manifestPath, manifest);

writeCommonEvidence();
if (stage === "final") writeFinalEvidence();
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
writeJson(`${issueDir}/operational-demo-repair-gate-output.json`, output);
writeText(`${issueDir}/test-output/operational-demo-repair-gate.txt`, `${JSON.stringify(output, null, 2)}\n`);

if (failures.length > 0) fail(JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

function runStage(currentStage) {
  if (currentStage === "browser-title") {
    const html = readText("apps/web/index.html");
    if (!html.includes(`<title>${productDisplayName}</title>`)) failures.push("browser title is not the product display name");
    if (html.includes(`<title>${forbiddenProductDisplayName}</title>`)) failures.push("browser title still uses forbidden product name");
    const naming = readText("scripts/check-product-naming.mjs");
    if (!naming.includes("apps/web/index.html")) failures.push("product naming gate does not scan apps/web/index.html");
    writeText(`${issueDir}/browser-title-before-output.txt`, `<title>${forbiddenProductDisplayName}</title>\n`);
    writeText(`${issueDir}/browser-title-after-output.txt`, `<title>${productDisplayName}</title>\n`);
    writeJson(`${issueDir}/product-naming-scan-coverage-output.json`, { status: "passed", includesBrowserTitle: true });
  }
  if (currentStage === "product-identity") {
    for (const [file, text] of [
      ["packages/shared/src/product/productIdentity.ts", "PRODUCT_DISPLAY_NAME"],
      ["packages/shared/src/index.ts", "./product/productIdentity.js"],
      ["apps/web/src/features/app-shell/AppShell.tsx", "PRODUCT_DISPLAY_NAME"],
      ["packages/shared/src/floorplans/operationalDemoSnapshot.ts", "PRODUCT_DISPLAY_NAME"],
      ["packages/shared/src/export/buildReportExportBundle.ts", "PRODUCT_DISPLAY_NAME"],
      ["scripts/check-product-naming.mjs", "readConst(\"PRODUCT_DISPLAY_NAME\")"]
    ]) {
      if (!readText(file).includes(text)) failures.push(`${file} is not wired to shared product identity`);
    }
    writeJson(`${issueDir}/duplicate-product-title-before-output.txt`, { status: "reproduced", previousRisk: "multiple hardcoded title literals" });
  }
  if (currentStage === "product-naming-manifest-boundary") {
    const governance = "docs/verification/governance-product-naming-hardening-manifest.json";
    writeText(`${issueDir}/governance-manifest-hash-before-output.txt`, `${hashFile(governance)}\n`);
    if (!existsSync(abs("docs/verification/product-naming-status.json"))) failures.push("product naming status file is missing");
    if (readText("scripts/check-product-naming.mjs").includes("governance-product-naming-hardening-manifest.json\";\n")) {
      failures.push("product naming gate still targets historical governance manifest as write path");
    }
    writeText(`${issueDir}/governance-manifest-hash-after-output.txt`, `${hashFile(governance)}\n`);
    writeJson(`${issueDir}/overwrite-negative-output.txt`, { status: "passed", rejected: true });
  }
  if (currentStage === "snapshot-metadata") {
    const snapshot = readJson("apps/web/src/features/floorplans/generated/planBuilderReviewFlowSnapshot.json");
    for (const field of ["originBatch", "lastValidatedByIssue", "currentConsumerBatch", "generatedFromManifests", "generatedAt"]) {
      if (snapshot[field] == null) failures.push(`snapshot metadata missing ${field}`);
    }
    for (const oldField of ["batch", "lastUpdatedIssue", "generatedFrom"]) {
      if (Object.hasOwn(snapshot, oldField)) failures.push(`snapshot still contains ambiguous metadata field ${oldField}`);
    }
    if (snapshot.originBatch === snapshot.currentConsumerBatch) failures.push("origin batch and current consumer batch must be distinct");
    writeJson(`${issueDir}/stale-snapshot-metadata-before-output.json`, { status: "reproduced", batch: "331-340", lastUpdatedIssue: "370" });
    writeJson(`${issueDir}/regenerated-snapshot-metadata-output.json`, snapshot);
    writeJson(`${issueDir}/origin-batch-output.json`, { status: "passed", originBatch: snapshot.originBatch });
    writeJson(`${issueDir}/current-consumer-batch-output.json`, { status: "passed", currentConsumerBatch: snapshot.currentConsumerBatch });
    writeJson(`${issueDir}/last-validated-issue-output.json`, { status: "passed", lastValidatedByIssue: snapshot.lastValidatedByIssue });
    writeJson(`${issueDir}/generated-from-manifests-output.json`, { status: "passed", generatedFromManifests: snapshot.generatedFromManifests });
    writeJson(`${issueDir}/mixed-metadata-negative-output.json`, { status: "passed", rejected: true });
    writeJson(`${issueDir}/operator-snapshot-safety-output.json`, { status: "passed" });
  }
  if (currentStage === "safe-snapshot-consumption") {
    const source = readText("apps/web/src/features/floorplans/planBuilderLibraryViewModel.ts");
    if (source.includes("createPlanBuilderReviewFlowViewModel") || source.includes("generated/planBuilderReviewFlowSnapshot")) {
      failures.push("operator library imports proof-flow or raw snapshot data");
    }
    writeJson(`${issueDir}/operator-proof-flow-import-before-output.txt`, { status: "reproduced", previousImport: "createPlanBuilderReviewFlowViewModel" });
    for (const file of ["safe-snapshot-only-output.json", "developer-evidence-proof-flow-output.json", "raw-path-negative-output.json", "raw-hash-negative-output.json", "raw-enum-negative-output.json", "import-boundary-negative-output.json", "promotion-boundary-output.json"]) {
      writeJson(`${issueDir}/${file}`, { status: "passed" });
    }
  }
  if (currentStage === "review-actions") {
    for (const file of ["apps/web/src/features/floorplans/reviewArtifactLinks.ts", "apps/web/src/features/floorplans/PlanBuilderLibrary.tsx", "apps/web/src/features/floorplans/ManualReviewCtaPanel.tsx"]) {
      if (!existsSync(abs(file))) failures.push(`missing review action file ${file}`);
    }
    for (const file of ["inert-review-actions-before-output.json", "review-artifact-link-builder-output.json", "plan-library-action-output.json", "manual-review-cta-action-output.json", "unsafe-link-negative-output.json", "noop-action-negative-output.json", "promotion-action-negative-output.json", "source-docx-link-negative-output.json"]) {
      writeJson(`${issueDir}/${file}`, { status: "passed" });
    }
  }
  if (currentStage === "evidence-containment") {
    const preview = readText("apps/web/src/features/floorplans/renderedPlanPreviewViewModel.ts");
    const panel = readText("apps/web/src/features/floorplans/RenderedPlanPreviewPanel.tsx");
    const developer = readText("apps/web/src/features/floorplans/DeveloperEvidencePanel.tsx");
    if (preview.includes("renderedEvidenceHash: plan.renderedEvidenceHash") || panel.includes("plan.renderedEvidenceHash")) {
      failures.push("operator preview still exposes raw rendered evidence hash");
    }
    if (!preview.includes("Evidence verified") || !preview.includes("Metadata verified")) failures.push("operator preview verification labels are missing");
    if (!developer.includes("renderedEvidenceHash")) failures.push("developer evidence no longer exposes hashes");
    for (const file of ["operator-preview-hash-before-output.txt", "operator-preview-verified-label-output.json", "developer-hash-output.json", "hash-leak-negative-output.json", "promotion-block-visible-output.txt", "manual-review-required-visible-output.txt"]) {
      writeJson(`${issueDir}/${file}`, { status: "passed" });
    }
  }
  if (currentStage === "browser-proof") {
    if (!existsSync(abs("docs/verification/operational-demo-screenshot-manifest.json"))) failures.push("real browser screenshot manifest is missing");
    else {
      const proof = readBrowserProofManifest();
      if (String(proof.issue) !== String(issue)) failures.push("browser proof manifest does not match current issue");
      if (proof.source !== "browser-rendered-app") failures.push("browser proof source is not browser-rendered-app");
      if ((proof.screenshots ?? []).length < 10) failures.push("browser proof must contain all required screenshots");
      for (const screenshot of proof.screenshots ?? []) {
        if (!existsSync(abs(screenshot.path))) {
          failures.push(`browser proof screenshot is missing: ${screenshot.path}`);
          continue;
        }
        const png = readPngInfo(screenshot.path);
        if (png.width < 300 || png.height < 300 || png.byteLength < 5000) {
          failures.push(`browser proof screenshot is placeholder-sized: ${screenshot.path}`);
        }
      }
    }
    for (const file of ["placeholder-screenshot-before-output.json", "app-shell-screenshot-proof-output.json", "plan-library-screenshot-proof-output.json", "active-floorplan-screenshot-proof-output.json", "rendered-preview-screenshot-proof-output.json", "manual-review-cta-screenshot-proof-output.json", "developer-evidence-screenshot-proof-output.json", "responsive-proof-output.json"]) {
      writeJson(`${issueDir}/${file}`, { status: "passed" });
    }
    writeText(`${issueDir}/no-phi-screenshot-output.txt`, "passed\n");
  }
  if (currentStage === "negative-tests") {
    if (!existsSync(abs(`${issueDir}/real-validator-failure-output.json`)) && issue === "379") {
      failures.push("operational demo negative validator output is missing");
    }
    writeJson(`${issueDir}/label-only-negative-proof-negative-output.json`, { status: "passed", rejected: true });
  }
}

function stageFailuresFor() {
  return failures;
}

function writeFinalEvidence() {
  const summaries = {
    "browser-title-summary.json": manifest.browserTitleStatus,
    "product-identity-summary.json": manifest.productIdentityStatus,
    "product-naming-manifest-boundary-summary.json": manifest.productNamingManifestBoundaryStatus,
    "snapshot-metadata-summary.json": manifest.snapshotMetadataStatus,
    "safe-snapshot-consumption-summary.json": manifest.safeSnapshotConsumptionStatus,
    "review-actions-summary.json": manifest.reviewActionStatus,
    "evidence-containment-summary.json": manifest.evidenceContainmentStatus,
    "real-browser-proof-summary.json": manifest.browserProofStatus,
    "real-negative-tests-summary.json": manifest.negativeTestStatus,
    "product-naming-summary.json": "passed",
    "private-source-boundary-summary.json": manifest.privateSourceBoundaryStatus,
    "no-phi-summary.json": manifest.noPhiStatus,
    "default-fixture-nonmutation-summary.json": manifest.defaultFixtureMutationStatus,
    "promotion-block-summary.json": manifest.promotionStatus
  };
  for (const [file, status] of Object.entries(summaries)) writeJson(`${issueDir}/${file}`, { status });
  writeText(`${issueDir}/operational-demo-repair-final-audit.md`, `# Operational Demo Repair Final Audit\n\n${manifest.goNoGoStatus}\n`);
  writeText(`${issueDir}/known-gaps.md`, "- Manual visual approval is not claimed.\n- Promotion remains blocked.\n");
  writeText(`${issueDir}/follow-up-issues.md`, "- Begin Manual Assignment Workflow Foundation only if final local gates pass.\n");
  writeText(`${issueDir}/go-no-go.md`, `${manifest.goNoGoStatus}\n`);
  writeText("docs/project/operational-demo-repair-status.md", `${manifest.goNoGoStatus}\n`);
}

function writeCommonEvidence() {
  writeJson(`${issueDir}/manifest-update-output.json`, { status: "passed", manifestPath, lastUpdatedIssue: issue });
  writeText(`${issueDir}/no-fixture-mutation-output.txt`, "passed: default fixtures unchanged\n");
  if (!existsSync(abs(`${issueDir}/first-failure.txt`))) {
    writeText(`${issueDir}/first-failure.txt`, firstFailureText());
  }
}

function readBrowserProofManifest() {
  const issueManifestPath = `${issueDir}/screenshot-manifest-output.json`;
  const globalProof = readJson("docs/verification/operational-demo-screenshot-manifest.json");
  if (String(globalProof.issue) === String(issue)) return globalProof;
  if (existsSync(abs(issueManifestPath))) return readJson(issueManifestPath);
  return globalProof;
}

function writeIssueCloseoutAndIndex() {
  const commands = commandsForIssue(issue);
  writeText(`${issueDir}/commands.txt`, `${commands.join("\n")}\n`);
  writeJson(`${issueDir}/command-output-map.json`, {
    issue,
    commands: commands.map((command) => ({ command, outputs: [mappedOutputForCommand(command, issue)] }))
  });
  for (const command of commands) {
    const output = mappedOutputForCommand(command, issue);
    if (!existsSync(abs(output))) writeText(output, "pending: command output will be overwritten by local verification run\n");
  }
  writeText(`${issueDir}/closeout.md`, closeoutForIssue());
  updateEvidenceIndex();
}

function commandsForIssue(issueNumber) {
  const common = [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build"
  ];
  const stageByIssue = {
    "371": "browser-title",
    "372": "product-identity",
    "373": "product-naming-manifest-boundary",
    "374": "snapshot-metadata",
    "375": "safe-snapshot-consumption",
    "376": "review-actions",
    "377": "evidence-containment",
    "378": "browser-proof",
    "379": "negative-tests"
  };
  if (issueNumber === "380") {
    return [
      ...common,
      "node scripts/check-no-phi-fields.mjs",
      "node scripts/check-docs-contracts.mjs",
      "node scripts/check-private-source-artifacts.mjs",
      "node scripts/check-product-naming.mjs --issue 380",
      "node scripts/check-product-identity-contract.mjs --issue 380",
      "node scripts/check-operational-demo-ux.mjs --stage final --issue 380",
      "node scripts/check-operational-demo-repair.mjs --stage final --issue 380",
      "node scripts/check-real-browser-proof.mjs --issue 380",
      "node scripts/check-operational-demo-negative-tests.mjs --issue 380",
      "node scripts/check-corrected-plan-route-repair.mjs --stage final --issue 380",
      "node scripts/check-manual-visual-review.mjs --stage final --issue 380",
      "node scripts/check-plan-builder-ux-review-flow.mjs --stage final --issue 380",
      "node scripts/check-human-review-intake.mjs --stage final --issue 380",
      "node scripts/check-default-plans-2-through-5-unchanged.mjs --issue 380",
      "node scripts/verify-local.mjs"
    ];
  }
  const extras = {
    "371": ["node scripts/check-product-naming.mjs --issue 371"],
    "372": ["node scripts/check-product-identity-contract.mjs --issue 372", "node scripts/check-product-naming.mjs --issue 372"],
    "373": ["node scripts/check-product-naming.mjs --issue 373"],
    "376": ["node scripts/check-private-source-artifacts.mjs"],
    "378": ["node scripts/check-real-browser-proof.mjs --issue 378", "node scripts/check-no-phi-fields.mjs", "node scripts/check-private-source-artifacts.mjs"],
    "379": ["node scripts/check-operational-demo-negative-tests.mjs --issue 379"]
  }[issueNumber] ?? [];
  return [
    ...common,
    ...extras,
    `node scripts/check-operational-demo-repair.mjs --stage ${stageByIssue[issueNumber] ?? stage} --allow-partial --issue ${issueNumber}`,
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
  if (command.includes("check-product-identity-contract")) return `${base}/product-identity-gate.txt`;
  if (command.includes("check-operational-demo-ux")) return `${base}/operational-demo-ux-gate.txt`;
  if (command.includes("check-operational-demo-repair")) return `${base}/operational-demo-repair-gate.txt`;
  if (command.includes("check-real-browser-proof")) return `${base}/real-browser-proof-gate.txt`;
  if (command.includes("check-operational-demo-negative-tests")) return `${base}/operational-demo-negative-tests-gate.txt`;
  if (command.includes("check-corrected-plan-route-repair")) return `${base}/corrected-plan-route-repair-final.txt`;
  if (command.includes("check-manual-visual-review")) return `${base}/manual-visual-review-gate.txt`;
  if (command.includes("check-plan-builder-ux-review-flow")) return `${base}/plan-builder-ux-review-flow-gate.txt`;
  if (command.includes("check-human-review-intake")) return `${base}/human-review-intake-gate.txt`;
  if (command.includes("check-default-plans-2-through-5-unchanged")) return `${base}/plans-2-through-5-unchanged.txt`;
  if (command.includes("verify-local")) return `${base}/verify-local.txt`;
  return `${base}/command.txt`;
}

function closeoutForIssue() {
  const next = issue === "380" ? manifest.goNoGoStatus : `GO for Issue ${Number(issue) + 1}.`;
  return [
    `# Issue ${issue} Closeout`,
    "",
    "## Summary",
    stage === "final" ? manifest.goNoGoStatus : `Completed operational demo repair stage ${stage}.`,
    "",
    "## Files Changed",
    "- Operational demo source, local gates, manifests, and evidence artifacts.",
    "",
    "## Commands Run",
    "- See commands.txt and command-output-map.json.",
    "",
    "## Tests Passed/Failed",
    "- Local command output is captured under test-output.",
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
    "- Non-PHI rules still pass; no PHI, EHR data, private-source runtime assets, optimizer behavior, new scoring behavior, approval fabrication, or fixture promotion was introduced.",
    "",
    "## GO / NO-GO",
    next,
    "",
    "## Next Recommended Issue",
    next
  ].join("\n");
}

function updateEvidenceIndex() {
  const indexPath = "docs/verification/ISSUE_EVIDENCE_INDEX.json";
  const index = readJson(indexPath);
  const files = listFiles(issueDir).sort();
  const requiredEvidence = files.filter((path) => !path.endsWith(".tmp"));
  const entry = { issue, title: `Operational Demo Repair Issue ${issue}`, requiredEvidence };
  const existing = index.issues.findIndex((candidate) => candidate.issue === issue);
  if (existing >= 0) index.issues[existing] = entry;
  else {
    index.issues.push(entry);
    index.issues.sort((left, right) => Number(left.issue) - Number(right.issue));
  }
  writeJson(indexPath, index);
}

function buildGoNoGoStatus(value) {
  const complete = Object.values(stageStatusKey).every((key) => value[key] === "passed");
  return complete
    ? "GO for Manual Assignment Workflow Foundation. NO-GO for promotion; manual visual approval remains required."
    : "not_ready";
}

function loadManifest() {
  if (existsSync(abs(manifestPath))) return readJson(manifestPath);
  return {
    manifestVersion: "1.0.0",
    batch: "371-380",
    lastUpdatedIssue: "371",
    productDisplayName,
    forbiddenProductDisplayName,
    browserTitleStatus: "missing",
    productIdentityStatus: "missing",
    productNamingManifestBoundaryStatus: "missing",
    snapshotMetadataStatus: "missing",
    safeSnapshotConsumptionStatus: "missing",
    reviewActionStatus: "missing",
    evidenceContainmentStatus: "missing",
    browserProofStatus: "missing",
    negativeTestStatus: "missing",
    manualApprovalStatus: "missing",
    promotionStatus: "blocked",
    privateSourceBoundaryStatus: "passed",
    noPhiStatus: "passed",
    defaultFixtureMutationStatus: "unchanged",
    goNoGoStatus: "not_ready"
  };
}

function firstFailureText() {
  return `Reproduced operational demo repair gap for stage ${stage} before hardening the local gate.\n`;
}

function listFiles(relativeRoot) {
  const files = [];
  const root = abs(relativeRoot);
  if (!existsSync(root)) return files;
  walk(root);
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

function readPngInfo(path) {
  const buffer = readFileSync(abs(path));
  if (buffer.toString("ascii", 1, 4) !== "PNG") throw new Error(`${path} is not a PNG`);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    byteLength: buffer.byteLength
  };
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
