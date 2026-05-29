#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { withBrowserRenderedApp } from "./lib/app-browser-proof.mjs";
import {
  abs,
  collectTextFiles,
  createRepairContext,
  finalizeRepairGate,
  fileExists,
  readText,
  readJson,
  runSelectedRepairStages,
  writeJson,
  writeText
} from "./lib/simulation-v0-repair-utils.mjs";

const ROUTES = [
  ["locked-access", "floorplans", ".demo-pin-entry-screen", false],
  ["floorplan", "floorplans", ".app-shell", true],
  ["editor", "editor", "[aria-labelledby='editor-title']", true],
  ["manual-assignment", "manual-assignment", "[aria-labelledby='manual-assignment-section-title']", true],
  ["scenarios", "scenarios", "[aria-labelledby='scenarios-title']", true],
  ["simulation", "simulation", "[aria-labelledby='simulation-title']", true],
  ["reports", "reports", "[aria-labelledby='reports-title']", true],
  ["settings", "settings", "[aria-labelledby='settings-title']", true],
  ["advanced-evidence", "developer-evidence", "[aria-labelledby='developer-evidence-title']", true],
  ["routes", "routes", "[aria-labelledby='routes-title']", true],
  ["assignments", "assignments", "[aria-labelledby='assignments-title']", true]
];

const stages = [
  "policy-hardening",
  "route-matrix",
  "rendered-copy",
  "generic-demo-negative",
  "advanced-evidence-exception",
  "product-docs-copy",
  "source-identifier-allowlist",
  "negative-fixture",
  "missing-route-negative",
  "allowlist-negative",
  "access-credential",
  "final"
];

const context = createRepairContext({
  scriptName: "visible product copy all routes",
  stages,
  statusKeyByStage: {
    "policy-hardening": "visibleCopyPolicyHardeningStatus",
    "route-matrix": "visibleCopyAllRoutesStatus",
    "rendered-copy": "visibleCopyAllRoutesStatus",
    "generic-demo-negative": "visibleCopyPolicyHardeningStatus",
    "advanced-evidence-exception": "visibleCopyPolicyHardeningStatus",
    "product-docs-copy": "visibleCopyPolicyHardeningStatus",
    "source-identifier-allowlist": "visibleCopyPolicyHardeningStatus",
    "access-credential": "visibleCopyAllRoutesStatus"
  },
  outputName: "rendered-copy-scan-output.json",
  defaultIssue: "581"
});

const preservedManifest = Number(context.issue) >= 611 ? readText(context.manifestPath) : null;
await runSelectedRepairStages(context, runStage);
finalizeRepairGate(context, {
  testOutputName: "visible-product-copy-all-routes.txt",
  manifestUpdates: {
    visibleCopyAllRoutesStatus: context.checks.every((check) => check.passed) ? "passed" : "failed",
    allProductRoutesScanned: context.checks.every((check) => check.passed),
    routesScanned: ROUTES.map(([id]) => id),
    visibleLegacyCopyStatus: context.checks.every((check) => check.passed) ? "passed" : "failed",
    accessCredentialVisibleStatus: context.checks.every((check) => check.passed) ? "passed" : "failed"
    ,
    visibleCopyPolicyHardeningStatus: context.checks.every((check) => check.passed) ? "passed" : "failed",
    visibleCopyPolicyFailClosed: context.checks.every((check) => check.passed)
  }
});
if (preservedManifest != null) writeText(context.manifestPath, preservedManifest);

async function runStage(stage) {
  if (stage === "policy-hardening") {
    const policy = readJson("docs/verification/visible-product-copy-policy.json");
    const requiredGroups = [
      "renderedProductForbiddenFragments",
      "advancedEvidenceAllowedFragments",
      "sourceIdentifierAllowlistRules",
      "productDocsForbiddenFragments"
    ];
    const missingGroups = requiredGroups.filter((key) => !Array.isArray(policy[key]));
    const requiredFragments = [
      "demo",
      "Demo",
      "DEMO",
      "demo workflow",
      "demo seed",
      "demo review",
      "trial",
      "Relock Demo",
      "Demo PIN",
      "Plan 1 Demo Guide",
      "recommended assignment",
      "best assignment"
    ];
    const missingFragments = requiredFragments.filter((fragment) =>
      !policy.renderedProductForbiddenFragments?.includes(fragment)
    );
    const passed = missingGroups.length === 0 && missingFragments.length === 0;
    context.add("visible product copy policy uses scoped fail-closed groups", passed, { missingGroups, missingFragments });
    writeJson(`${context.dir}/policy-hardening-output.json`, {
      status: passed ? "passed" : "failed",
      policyVersion: policy.policyVersion,
      missingGroups,
      missingFragments
    });
  }
  if (stage === "route-matrix") {
    const policy = readJson("docs/verification/visible-product-copy-policy.json");
    const required = policy.requiredRoutes ?? [];
    const routeIds = ROUTES.map(([id]) => id);
    const missing = required.filter((id) => !routeIds.includes(id));
    const extra = routeIds.filter((id) => !required.includes(id));
    context.add("visible product copy policy exists", Array.isArray(required) && required.length > 0, { policyPath: "docs/verification/visible-product-copy-policy.json" });
    context.add("required route matrix exactly matches policy", missing.length === 0 && extra.length === 0, { routeIds, missing, extra });
    writeJson(`${context.dir}/route-matrix-output.json`, { status: missing.length === 0 && extra.length === 0 ? "passed" : "failed", routeIds, required, missing, extra });
  }
  if (stage === "rendered-copy") {
    const scan = await scanRoutes();
    const forbiddenCount = scan.routes.reduce((sum, route) => sum + route.forbiddenFindings.length, 0);
    const credentialCount = scan.routes.reduce((sum, route) => sum + (route.accessCredentialVisible ? 1 : 0), 0);
    const missingScreenshots = scan.routes.filter((route) => !route.screenshotOk).map((route) => route.routeId);
    context.add("every required route rendered", scan.routes.length === ROUTES.length, scan.summary);
    context.add("route screenshots exist and are non-empty", missingScreenshots.length === 0, { missingScreenshots });
    context.add("rendered route text has no forbidden visible fragments", forbiddenCount === 0, { forbiddenCount });
    context.add("rendered route text has no visible access credential", credentialCount === 0, { credentialCount });
    writeJson(`${context.dir}/rendered-copy-scan-output.json`, scan);
    writeJson(`${context.dir}/rendered-product-route-output.json`, scan);
  }
  if (stage === "generic-demo-negative") {
    const failed = scanText("Synthetic rendered product copy with demo workflow and demo seed", {
      routeId: "floorplan",
      scope: "product"
    }).forbiddenFindings.length > 0;
    context.add("generic demo variants fail on product route text", failed, null);
    writeJson(`${context.dir}/generic-demo-negative-output.json`, { status: failed ? "passed" : "failed" });
  }
  if (stage === "advanced-evidence-exception") {
    const scan = scanText("Historical internal demo workflow evidence", {
      routeId: "advanced-evidence",
      scope: "advanced-evidence"
    });
    const allowed = scan.forbiddenFindings.length === 0 && scan.allowedFindings.length > 0;
    context.add("advanced/evidence route can carry explicit historical/internal exceptions", allowed, scan);
    writeJson(`${context.dir}/advanced-evidence-exception-output.json`, { status: allowed ? "passed" : "failed", scan });
  }
  if (stage === "product-docs-copy") {
    const policy = readJson("docs/verification/visible-product-copy-policy.json");
    const findings = scanProductDocs(policy.productDocsForbiddenFragments ?? []);
    context.add("product-facing docs do not contain forbidden legacy user-facing terms", findings.length === 0, { findings });
    writeJson(`${context.dir}/product-docs-copy-output.json`, { status: findings.length === 0 ? "passed" : "failed", findings });
  }
  if (stage === "source-identifier-allowlist") {
    const current = readJson("docs/verification/visible-product-copy-allowlist.json");
    const policy = readJson("docs/verification/visible-product-copy-policy.json");
    const invalidCurrent = (current.entries ?? []).filter((entry) => !allowlistEntryValid(entry));
    const invalidPolicyRules = (policy.sourceIdentifierAllowlistRules ?? []).filter((entry) => !allowlistEntryValid(entry));
    const passed = invalidCurrent.length === 0 && invalidPolicyRules.length === 0;
    context.add("source identifier allowlist entries include scope, classification, justification, and expiry", passed, { invalidCurrent, invalidPolicyRules });
    writeJson(`${context.dir}/source-identifier-allowlist-output.json`, {
      status: passed ? "passed" : "failed",
      entryCount: (current.entries ?? []).length,
      policyRuleCount: (policy.sourceIdentifierAllowlistRules ?? []).length,
      invalidCurrent,
      invalidPolicyRules
    });
  }
  if (stage === "negative-fixture") {
    const policy = readJson("docs/verification/visible-product-copy-policy.json");
    const forbidden = forbiddenFragmentsForScope(policy, "product")[0];
    const failed = scanText(`Synthetic rendered copy ${forbidden}`).forbiddenFindings.length > 0;
    context.add("rendered forbidden term negative fixture fails", failed, { forbidden });
    writeJson(`${context.dir}/negative-visible-copy-fixture-output.json`, { status: failed ? "passed" : "failed", forbidden });
  }
  if (stage === "missing-route-negative") {
    const routeIds = ROUTES.slice(1).map(([id]) => id);
    const required = readJson("docs/verification/visible-product-copy-policy.json").requiredRoutes;
    const missing = required.filter((id) => !routeIds.includes(id));
    context.add("missing route negative fixture fails", missing.length > 0, { missing });
    writeJson(`${context.dir}/missing-route-negative-output.json`, { status: missing.length > 0 ? "passed" : "failed", missing });
  }
  if (stage === "allowlist-negative") {
    const invalidEntry = { path: "apps/web/src/example.ts" };
    const failed = !allowlistEntryValid(invalidEntry);
    const current = readJson("docs/verification/visible-product-copy-allowlist.json");
    const invalidCurrent = (current.entries ?? []).filter((entry) => !allowlistEntryValid(entry));
    context.add("allowlist entry without justification negative fixture fails", failed, invalidEntry);
    context.add("current visible copy allowlist entries include classification and justification", invalidCurrent.length === 0, { invalidCurrent });
    writeJson(`${context.dir}/allowlist-negative-output.json`, { status: failed && invalidCurrent.length === 0 ? "passed" : "failed", invalidCurrent });
    writeJson(`${context.dir}/visible-copy-allowlist-output.json`, { status: invalidCurrent.length === 0 ? "passed" : "failed", entryCount: (current.entries ?? []).length });
  }
  if (stage === "access-credential") {
    const credential = readInternalAccessCredential();
    const rendered = await scanRoutes();
    const evidenceFindings = scanFilesForCredential([
      "docs/verification/issues",
      "docs/project",
      "docs/verification/visible-product-copy-policy.json",
      "docs/verification/visible-product-copy-allowlist.json"
    ], credential);
    const renderedCount = rendered.routes.filter((route) => route.accessCredentialVisible).length;
    const negativeFixtureFails = scanText(`Synthetic rendered copy Access code ${credential}`).accessCredentialVisible;
    context.add("rendered access credential negative fixture fails", negativeFixtureFails, { fixture: "Access code <configured>" });
    context.add("rendered routes do not expose configured access credential", renderedCount === 0, { renderedCount });
    context.add("issue evidence and product docs do not expose configured access credential", evidenceFindings.length === 0, { findingCount: evidenceFindings.length });
    writeJson(`${context.dir}/access-credential-output.json`, { status: negativeFixtureFails && renderedCount === 0 && evidenceFindings.length === 0 ? "passed" : "failed", renderedCount, evidenceFindingCount: evidenceFindings.length, negativeFixtureFails });
  }
}

async function scanRoutes() {
  const policy = readJson("docs/verification/visible-product-copy-policy.json");
  const credential = readInternalAccessCredential();
  const port = Number(context.args.port ?? 6810);
  const chromePort = Number(context.args["chrome-port"] ?? 9810);
  const unlockedScript = `try { sessionStorage.setItem("nerdeus.workspaceAccess.sessionUnlock.v1", JSON.stringify({ unlocked: true, unlockedAtMs: 1000 })); } catch {}`;
  const result = await withBrowserRenderedApp({ port, chromePort, width: 1440, height: 1000 }, async (browser) => {
    const routes = [];
    for (const [routeId, section, readySelector, unlocked] of ROUTES) {
      if (unlocked) await browser.evaluate(unlockedScript);
      else await browser.evaluate("try { sessionStorage.clear(); } catch {}");
      await browser.navigate(`${browser.baseUrl}/?section=${section}`, `document.querySelector(${JSON.stringify(readySelector)}) != null`);
      const screenshotPath = `${context.dir}/screenshots/${routeId}.png`;
      await browser.screenshot(screenshotPath);
      const screenshotOk = fileExists(screenshotPath, 100);
      const bodyText = await browser.evaluate("document.body.textContent || ''");
      const textScan = scanText(bodyText, {
        routeId,
        scope: policy.advancedEvidenceRoutes?.includes(routeId) ? "advanced-evidence" : "product"
      });
      routes.push({
        routeId,
        section,
        screenshotPath,
        screenshotOk,
        renderedTextLength: bodyText.length,
        ...textScan
      });
    }
    return routes;
  });
  return {
    status: "passed",
    routes: result.result,
    summary: {
      routeCount: result.result.length,
      forbiddenFragmentCount: result.result.reduce((sum, route) => sum + route.forbiddenFindings.length, 0),
      credentialFindingCount: result.result.filter((route) => route.accessCredentialVisible).length
    }
  };
}

function scanText(text, policy = readJson("docs/verification/visible-product-copy-policy.json"), credential = readInternalAccessCredential()) {
  let options = {};
  if (policy?.scope != null || policy?.routeId != null) {
    options = policy;
    policy = readJson("docs/verification/visible-product-copy-policy.json");
    credential = readInternalAccessCredential();
  }
  const scope = options.scope ?? (policy.advancedEvidenceRoutes?.includes(options.routeId) ? "advanced-evidence" : "product");
  const forbidden = forbiddenFragmentsForScope(policy, scope);
  const allowed = scope === "advanced-evidence" ? policy.advancedEvidenceAllowedFragments ?? [] : [];
  const forbiddenFindings = forbidden.filter((fragment) => text.includes(String(fragment)));
  const allowedFindings = allowed.filter((fragment) => text.includes(String(fragment)));
  return {
    forbiddenFindings,
    allowedFindings,
    accessCredentialVisible: new RegExp(`(?:access code|pin|credential|code)\\s*${escapeRegExp(credential)}\\b`, "iu").test(text)
  };
}

function allowlistEntryValid(entry) {
  return typeof entry?.path === "string" &&
    (typeof entry.route === "string" || typeof entry.scope === "string") &&
    typeof entry.classification === "string" &&
    typeof entry.justification === "string" &&
    entry.justification.length > 20 &&
    (typeof entry.expiry === "string" || typeof entry.removalCondition === "string");
}

function forbiddenFragmentsForScope(policy, scope) {
  if (scope === "advanced-evidence") {
    const allowed = new Set(policy.advancedEvidenceAllowedFragments ?? []);
    return (policy.renderedProductForbiddenFragments ?? []).filter((fragment) => !allowed.has(fragment));
  }
  return policy.renderedProductForbiddenFragments ?? policy.forbiddenVisibleFragments ?? [];
}

function scanProductDocs(fragments) {
  const findings = [];
  const files = collectTextFiles("docs/project");
  for (const file of files) {
    const text = readFileSafe(file);
    if (text == null) continue;
    for (const fragment of fragments) {
      if (text.includes(String(fragment))) findings.push({ file, fragment });
    }
  }
  return findings;
}

function readInternalAccessCredential() {
  const source = readFileSync(abs("packages/shared/src/demo-pin/demoPinContract.ts"), "utf8");
  const match = source.match(/DEMO_PIN_CODE\s*=\s*"([^"]+)"/u);
  if (match == null) throw new Error("Unable to read configured access credential contract");
  return match[1];
}

function scanFilesForCredential(paths, credential) {
  const findings = [];
  for (const path of paths) {
    const files = collectTextFiles(path);
    for (const file of files) {
      const text = readFileSafe(file);
      if (text != null && containsCredentialLeak(text, credential)) findings.push({ path: file });
    }
  }
  return findings;
}

function readFileSafe(path) {
  try {
    return readFileSync(abs(path), "utf8");
  } catch {
    return null;
  }
}

function containsCredentialLeak(text, credential) {
  return new RegExp(`(?:access code|pin|credential|code)\\s*${escapeRegExp(credential)}\\b`, "iu").test(text);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
