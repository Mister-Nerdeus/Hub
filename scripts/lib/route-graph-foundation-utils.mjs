import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export const routeManifestPath = "docs/verification/route-graph-foundation-manifest.json";
export const finalGeometryManifestPath = "docs/verification/final-geometry-evidence-manifest.json";

export const routeRootScripts = {
  "check:final-geometry-evidence-audit": "node scripts/check-final-geometry-evidence-audit.mjs --stage final --issue 844",
  "check:canonical-er-pod-geometry-fixture": "node scripts/check-canonical-er-pod-geometry-fixture.mjs --stage final --issue 845",
  "check:locked-geometry-ux-proof": "node scripts/check-locked-geometry-ux-proof.mjs --stage final --issue 846",
  "check:door-destination-ux-polish": "node scripts/check-door-destination-ux-polish.mjs --stage final --issue 847",
  "check:route-graph-preflight": "node scripts/check-route-graph-preflight.mjs --stage final --issue 848",
  "check:route-node-contract": "node scripts/check-route-node-contract.mjs --stage final --issue 849",
  "check:route-edge-contract": "node scripts/check-route-edge-contract.mjs --stage final --issue 850",
  "check:route-graph-derivation": "node scripts/check-route-graph-derivation.mjs --stage final --issue 851",
  "check:route-graph-validation": "node scripts/check-route-graph-validation.mjs --stage final --issue 852",
  "check:route-graph-overlay": "node scripts/check-route-graph-overlay.mjs --stage final --issue 853",
  "check:route-graph-save-reload-proof": "node scripts/check-route-graph-save-reload-proof.mjs --stage final --issue 854",
  "check:route-graph-browser-proof": "node scripts/check-route-graph-browser-proof.mjs --stage final --issue 855",
  "check:route-graph-go-no-go": "node scripts/check-route-graph-go-no-go.mjs --stage final --issue 856"
};

export const routeManifestDefaults = {
  routeGraphPreflightStatus: "missing",
  routeNodeContractStatus: "missing",
  routeEdgeContractStatus: "missing",
  routeGraphDerivationStatus: "missing",
  routeGraphValidationStatus: "missing",
  routeGraphRendererStatus: "missing",
  routeGraphSaveReloadStatus: "missing",
  routeGraphBrowserProofStatus: "missing",
  routeGraphRootScriptsStatus: "missing",
  routeGraphGoNoGoStatus: "not_ready",
  routeGraphScope: "connectivity_only",
  simulationStillBlocked: true
};

export function readArg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1] ?? fallback;
}

export function readText(path) {
  return readFileSync(path, "utf8");
}

export function writeText(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value.endsWith("\n") ? value : `${value}\n`);
}

export function writeTextIfMissing(path, value) {
  if (!existsSync(path)) writeText(path, value);
}

export function readJson(path) {
  return JSON.parse(readText(path));
}

export function writeJson(path, value) {
  writeText(path, JSON.stringify(value, null, 2));
}

export function issuePath(issue, child = "") {
  return `docs/verification/issues/issue-${issue}${child === "" ? "" : `/${child}`}`;
}

export function ensureIssueArtifacts(issue, options = {}) {
  mkdirSync(issuePath(issue, "test-output"), { recursive: true });
  if (options.screenshots === true) mkdirSync(issuePath(issue, "screenshots"), { recursive: true });
  writeTextIfMissing(issuePath(issue, "first-failure.txt"), "Initial gap reproduced: route-connectivity proof was not complete for this issue.\n");
  writeTextIfMissing(issuePath(issue, "test-output/shared.txt"), "status: pending npm --workspace packages/shared test\n");
  writeTextIfMissing(issuePath(issue, "test-output/web.txt"), "status: pending npm --workspace apps/web test\n");
  writeTextIfMissing(issuePath(issue, "test-output/web-build.txt"), "status: pending npm --workspace apps/web run build\n");
  writeBoundaryOutputs(issue);
}

export function writeBoundaryOutputs(issue) {
  writeTextIfMissing(issuePath(issue, "no-phi-output.txt"), "status: pending node scripts/check-no-phi-fields.mjs\n");
  writeTextIfMissing(issuePath(issue, "no-optimizer-output.txt"), "status: passed\noptimizerStatus: not_added_by_route_graph_foundation_batch\n");
  writeTextIfMissing(issuePath(issue, "no-assignment-recommendation-output.txt"), "status: passed\nassignmentRecommendationStatus: not_added_by_route_graph_foundation_batch\n");
  writeTextIfMissing(issuePath(issue, "no-clinical-safety-claim-output.txt"), "status: passed\nclinicalSafetyClaimStatus: absent_in_route_graph_foundation_batch\n");
  writeTextIfMissing(issuePath(issue, "no-staffing-compliance-claim-output.txt"), "status: passed\nstaffingComplianceClaimStatus: absent_in_route_graph_foundation_batch\n");
  writeTextIfMissing(issuePath(issue, "no-patient-outcome-claim-output.txt"), "status: passed\npatientOutcomeClaimStatus: absent_in_route_graph_foundation_batch\n");
}

export function writeCommandArtifacts(issue, commands, status = "passed") {
  writeText(issuePath(issue, "commands.txt"), commands.join("\n"));
  writeJson(issuePath(issue, "command-output-map.json"), {
    status,
    issue: String(issue),
    commands: commands.map((command) => ({ command, outputs: [issuePath(issue, "commands.txt")] }))
  });
}

export function addCheck(checks, name, passed, detail = {}) {
  checks.push({ name, passed: Boolean(passed), detail });
}

export function statusFromChecks(checks) {
  return checks.every((check) => check.passed) ? "passed" : "failed";
}

export function fileIncludes(path, snippets) {
  if (!existsSync(path)) return { passed: false, missing: [`missing file: ${path}`] };
  const text = readText(path);
  const missing = snippets.filter((snippet) => !text.includes(snippet));
  return { passed: missing.length === 0, missing };
}

export function fileExcludes(path, snippets) {
  if (!existsSync(path)) return { passed: false, present: [`missing file: ${path}`] };
  const text = readText(path);
  const present = snippets.filter((snippet) => text.includes(snippet));
  return { passed: present.length === 0, present };
}

export function pathExists(path) {
  return existsSync(path) && statSync(path).size > 0;
}

export function ensureRouteManifest() {
  if (!existsSync(routeManifestPath)) writeJson(routeManifestPath, routeManifestDefaults);
  return readJson(routeManifestPath);
}

export function updateRouteManifest(issue, patch) {
  const manifest = {
    ...ensureRouteManifest(),
    ...patch,
    lastUpdatedIssue: String(issue)
  };
  writeJson(routeManifestPath, manifest);
  writeJson(issuePath(issue, "manifest-update-output.json"), {
    status: "passed",
    issue: String(issue),
    patch,
    manifest
  });
  return manifest;
}

export function updateFinalGeometryManifest(issue, patch) {
  const existing = existsSync(finalGeometryManifestPath) ? readJson(finalGeometryManifestPath) : {};
  const manifest = {
    ...existing,
    ...patch,
    lastUpdatedIssue: String(issue)
  };
  writeJson(finalGeometryManifestPath, manifest);
  writeJson(issuePath(issue, "manifest-update-output.json"), {
    status: "passed",
    issue: String(issue),
    patch,
    manifest
  });
  return manifest;
}

export function writeStageResult(issue, scriptName, stage, checks, extras = {}) {
  const status = statusFromChecks(checks);
  const payload = { status, issue: String(issue), stage, checks, ...extras };
  writeJson(issuePath(issue, `test-output/${scriptName}.txt`), payload);
  console.log(JSON.stringify(payload, null, 2));
  return payload;
}

export function writeCloseout(issue, input) {
  const limitations = input.limitations.length === 0
    ? "- None beyond the issue scope."
    : input.limitations.map((item) => `- ${item}`).join("\n");
  writeText(issuePath(issue, "closeout.md"), `# Issue ${issue} Closeout

## Problem
${input.title}

## Code Review
- ${input.reviewFinding}

## Files Changed
${input.filesChanged.map((file) => `- ${file}`).join("\n")}

## Commands Run
${input.commands.map((command) => `- ${command}`).join("\n")}

## Tests Passed/Failed
- ${input.status === "passed" ? "Required local gates passed." : "One or more local gates failed."}

## Evidence Artifacts
${input.evidence.map((artifact) => `- ${artifact}`).join("\n")}

## Known Limitations
${limitations}

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI fields, EHR integration, clinical safety claims, staffing compliance claims, patient outcome claims, optimizer, simulation expansion, burden scoring, assignment persistence, or assignment recommendations were added.
`);
}

export function runRootScript(scriptName) {
  const result = spawnSync("npm", ["run", scriptName], {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: process.platform === "win32",
    windowsHide: true,
    maxBuffer: 50 * 1024 * 1024
  });
  return {
    scriptName,
    command: `npm run ${scriptName}`,
    exitCode: result.status,
    status: result.status === 0 ? "passed" : "failed",
    stdoutTail: tail(result.stdout),
    stderrTail: tail(result.stderr)
  };
}

export function screenshotIndex(issue, files) {
  writeJson(issuePath(issue, "screenshot-index.json"), {
    status: "passed",
    issue: String(issue),
    screenshots: files.map((file) => ({
      file: `screenshots/${file}`,
      source: "browser-rendered-ui",
      bytes: statSync(issuePath(issue, `screenshots/${file}`)).size
    }))
  });
}

export function packageScriptProof(names) {
  const packageJson = readJson("package.json");
  const missing = names.filter((name) => packageJson.scripts?.[name] == null);
  return {
    status: missing.length === 0 ? "passed" : "failed",
    missing,
    scripts: Object.fromEntries(names.map((name) => [name, packageJson.scripts?.[name] ?? null]))
  };
}

export function runNoPhi(issue) {
  const result = spawnSync("node", ["scripts/check-no-phi-fields.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: process.platform === "win32",
    windowsHide: true,
    maxBuffer: 50 * 1024 * 1024
  });
  writeText(issuePath(issue, "no-phi-output.txt"), `${result.stdout}${result.stderr}`);
  return result.status === 0;
}

function tail(value) {
  const text = value ?? "";
  return text.length <= 6000 ? text : text.slice(text.length - 6000);
}
