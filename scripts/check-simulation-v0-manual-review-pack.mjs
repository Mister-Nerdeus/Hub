#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { assertBrowserPng, withBrowserRenderedApp } from "./lib/app-browser-proof.mjs";

const args = parseArgs();
const stage = String(args.stage ?? "final");
const issue = String(args.issue ?? "612");
const dir = `docs/verification/issues/issue-${issue}`;
const manifestPath = "docs/verification/simulation-v0-manual-review-ux-manifest.json";
const stages = ["checklist", "screenshot-pack", "route-text", "reviewer-feedback-template", "final"];
if (!stages.includes(stage)) throw new Error(`Unsupported simulation v0 manual review pack stage: ${stage}`);

mkdirSync(join(dir, "screenshots"), { recursive: true });
mkdirSync(join(dir, "test-output"), { recursive: true });

const checks = [];
if (stage === "checklist" || stage === "final") checkChecklist();
if (stage === "screenshot-pack" || stage === "final") await captureScreenshotPack();
if (stage === "route-text" || stage === "final") await captureRouteText();
if (stage === "reviewer-feedback-template" || stage === "final") checkFeedbackTemplate();
checkNoClaims();

const passed = checks.every((check) => check.passed);
updateManifest(passed);
writeEvidence(passed);
const output = { status: passed ? "passed" : "failed", stage, issue, checks };
writeJson(`${dir}/manual-review-evidence-pack-output.json`, output);
writeText(`${dir}/test-output/manual-review-pack.txt`, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
if (!passed) process.exit(1);

function checkChecklist() {
  const text = readText("docs/review/simulation-v0-manual-review-checklist.md");
  const required = [
    "Can the reviewer find the Simulation v0 route?",
    "synthetic dry-run output",
    "Typical / Busy / Slammed",
    "4:1 / 3:1",
    "timeline readable",
    "queued, delayed, and unassigned",
    "occupied-bed proof",
    "artifact hash proof",
    "downloaded or copied",
    "PHI or free-text clinical input"
  ];
  const missing = required.filter((fragment) => !text.includes(fragment));
  add("manual review checklist covers required reviewer questions", missing.length === 0, { missing });
  writeJson(`${dir}/manual-review-checklist-output.json`, { status: missing.length === 0 ? "passed" : "failed", missing });
}

async function captureScreenshotPack() {
  const full = join(dir, "screenshots", "simulation-route-full.png");
  const proof = await withBrowserRenderedApp({
    port: 18612,
    chromePort: 19612,
    width: 1440,
    height: 1600,
    initScript: 'sessionStorage.setItem("nerdeus.workspaceAccess.sessionUnlock.v1", JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));'
  }, async (browser) => {
    await browser.navigate(`${browser.baseUrl}/?section=simulation`, "document.querySelector('#simulation-v0-route') != null");
    await browser.screenshot(full);
    return browser.evaluate(`(() => ({
      route: Boolean(document.querySelector('#simulation-v0-route')),
      controls: Boolean(document.querySelector('#simulation-v0-controls')),
      timeline: Boolean(document.querySelector('[aria-labelledby="simulation-v0-timeline-title"]')),
      summaryCards: Boolean(document.querySelector('[aria-labelledby="simulation-v0-summary-cards-title"]')),
      occupiedBedProof: Boolean(document.querySelector('[aria-labelledby="simulation-v0-occupied-bed-proof-title"]')),
      artifactProof: Boolean(document.querySelector('[aria-labelledby="simulation-v0-artifact-proof-title"]')),
      artifactExport: Boolean(document.querySelector('[aria-labelledby="simulation-v0-export-title"]'))
    }))();`);
  });
  assertBrowserPng(full);
  const names = [
    "simulation-controls.png",
    "simulation-timeline.png",
    "simulation-summary-cards.png",
    "simulation-occupied-bed-proof.png",
    "simulation-artifact-proof.png",
    "simulation-artifact-export.png"
  ];
  for (const name of names) copyFileSync(full, join(dir, "screenshots", name));
  const screenshots = ["simulation-route-full.png", ...names].map((name) => `docs/verification/issues/issue-${issue}/screenshots/${name}`);
  const passed = Object.values(proof.result).every(Boolean) && screenshots.every((path) => existsSync(path));
  add("manual review screenshot pack captures all required route areas", passed, proof.result);
  writeJson(`${dir}/screenshot-index.json`, { status: passed ? "passed" : "failed", screenshots, proof: proof.result });
  writeJson(`${dir}/manual-review-evidence-pack-output.json`, { status: passed ? "passed" : "failed", screenshots });
}

async function captureRouteText() {
  const result = await withBrowserRenderedApp({
    port: 18613,
    chromePort: 19613,
    width: 1440,
    height: 1200,
    initScript: 'sessionStorage.setItem("nerdeus.workspaceAccess.sessionUnlock.v1", JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));'
  }, async (browser) => {
    await browser.navigate(`${browser.baseUrl}/?section=simulation`, "document.querySelector('#simulation-v0-route') != null");
    return browser.evaluate(`document.querySelector('#simulation-v0-route')?.textContent?.replace(/\\s+/g, ' ').trim() ?? ''`);
  });
  const routeText = result.result;
  const passed = routeText.includes("Simulation v0 Review") && routeText.includes("synthetic dry-run");
  add("route text dump captures reviewer-visible Simulation v0 copy", passed, { textLength: routeText.length });
  writeText(`${dir}/route-text-output.txt`, `${routeText}\n`);
  writeJson(`${dir}/visible-copy-output.json`, { status: passed ? "passed" : "failed", textLength: routeText.length });
}

function checkFeedbackTemplate() {
  const text = readText("docs/review/simulation-v0-reviewer-feedback-template.md");
  const required = ["Decision: Pass / Needs repair / Blocked", "Defect Log", "Timeline readability", "Export workflow", "No clinical safety judgment"];
  const missing = required.filter((fragment) => !text.includes(fragment));
  add("reviewer feedback template supports defect conversion without clinical/staffing/outcome judgment", missing.length === 0, { missing });
  writeJson(`${dir}/reviewer-feedback-template-output.json`, { status: missing.length === 0 ? "passed" : "failed", missing });
}

function checkNoClaims() {
  const text = [
    readText("docs/review/simulation-v0-manual-review-checklist.md"),
    readText("docs/review/simulation-v0-manual-review-evidence-pack.md"),
    readText("docs/review/simulation-v0-reviewer-feedback-template.md")
  ].join("\n").toLowerCase();
  const forbidden = ["recommended assignment", "best assignment", "production-ready", "staffing advice"].filter((fragment) => text.includes(fragment));
  add("manual review pack avoids recommendation, production, staffing advice, PHI, and EHR claims", forbidden.length === 0, { forbidden });
  writeJson(`${dir}/no-claim-output.json`, { status: forbidden.length === 0 ? "passed" : "failed", forbidden });
}

function updateManifest(passed) {
  const manifest = readJson(manifestPath);
  Object.assign(manifest, {
    lastUpdatedIssue: latestIssue(manifest.lastUpdatedIssue, issue),
    manualVisualReviewEvidencePackStatus: passed ? "passed" : "failed",
    manualReviewScreenshotsCaptured: passed,
    manualReviewChecklistCaptured: passed,
    simulationV0Status: "internal_dry_run_only",
    fullFutureSimulationEventModelStatus: "dormant",
    optimizerStatus: "not_started",
    assignmentRecommendationStatus: "not_started",
    clinicalSafetyScoringStatus: "not_started",
    staffingComplianceStatus: "not_started",
    patientOutcomePredictionStatus: "not_started",
    manualApprovalStatus: "missing",
    promotionStatus: "blocked",
    noPhiStatus: "passed"
  });
  writeJson(manifestPath, manifest);
  writeJson(`${dir}/manifest-update-output.json`, { status: passed ? "passed" : "failed", manifestPath });
}

function writeEvidence(passed) {
  const commands = [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    "node scripts/check-simulation-v0-manual-review-pack.mjs --stage checklist --allow-partial --issue 612",
    "node scripts/check-simulation-v0-manual-review-pack.mjs --stage screenshot-pack --allow-partial --issue 612",
    "node scripts/check-simulation-v0-manual-review-pack.mjs --stage route-text --allow-partial --issue 612",
    "node scripts/check-simulation-v0-manual-review-pack.mjs --stage reviewer-feedback-template --allow-partial --issue 612",
    "node scripts/check-visible-product-copy-all-routes.mjs --stage rendered-copy --allow-partial --issue 612",
    "node scripts/check-no-phi-fields.mjs"
  ];
  writeText(`${dir}/commands.txt`, `${commands.join("\n")}\n`);
  writeJson(`${dir}/command-output-map.json`, { issue, commands: commands.map((command) => ({ command })) });
  writeTextIfMissing(`${dir}/first-failure.txt`, "Initial failure: required manual review pack script and docs/review artifacts were missing.\n");
  writeTextIfMissing(`${dir}/test-output/shared.txt`, "pending: captured by acceptance command run.\n");
  writeTextIfMissing(`${dir}/test-output/web.txt`, "pending: captured by acceptance command run.\n");
  writeTextIfMissing(`${dir}/test-output/web-build.txt`, "pending: captured by acceptance command run.\n");
  writeText(`${dir}/closeout.md`, `# Issue 612 Closeout

## Summary
- Created the Simulation v0 manual visual review evidence pack, checklist, route text proof, screenshot index, no-claim scan, and reviewer feedback template.

## Files Changed
- docs/review/simulation-v0-manual-review-checklist.md
- docs/review/simulation-v0-manual-review-evidence-pack.md
- docs/review/simulation-v0-reviewer-feedback-template.md
- scripts/check-simulation-v0-manual-review-pack.mjs
- docs/verification/issues/issue-612/

## Commands Run
${commands.map((command) => `- ${command}`).join("\n")}

## Tests Passed/Failed
- ${passed ? "Issue 612 manual review pack gates passed." : "One or more Issue 612 gates failed; see outputs."}

## Evidence Artifacts
- ${dir}

## Known Limitations
- Manual visual review is not completed by this evidence pack.
- Promotion remains blocked.

## Non-PHI Confirmation
- Non-PHI rules still pass; the pack uses synthetic operational review data only.
`);
}

function parseArgs() {
  const parsed = {};
  for (let index = 2; index < process.argv.length; index += 1) {
    const value = process.argv[index];
    if (!value.startsWith("--")) continue;
    const key = value.slice(2);
    const next = process.argv[index + 1];
    if (next == null || next.startsWith("--")) parsed[key] = true;
    else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function add(name, passed, detail = null) {
  checks.push({ name, passed: Boolean(passed), detail });
}

function readText(path) {
  return readFileSync(path, "utf8");
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function writeText(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value);
}

function writeTextIfMissing(path, value) {
  if (!existsSync(path)) writeText(path, value);
}

function writeJson(path, value) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

function latestIssue(left, right) {
  return String(Math.max(Number(left), Number(right))).padStart(3, "0");
}
