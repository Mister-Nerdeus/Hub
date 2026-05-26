import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();
const manifestPath = join(
  repoRoot,
  "packages",
  "shared",
  "fixtures",
  "default-plans",
  "source-layout-manifest.json"
);

const repoPaths = {
  docsFloorplans: join(repoRoot, "docs", "floorplans"),
  correctedSourceCorrections: join(repoRoot, "packages", "shared", "fixtures", "source-corrections"),
  correctedReviewManifest: join(repoRoot, "docs", "verification", "corrected-plan-review-manifest.json"),
  manualReviewManifest: join(repoRoot, "docs", "verification", "manual-visual-review-manifest.json"),
  manualReviewDocs: join(repoRoot, "docs", "manual-review"),
  promotionDryRunDocs: join(repoRoot, "docs", "promotion-dry-run"),
  correctedRenderedPlans: join(repoRoot, "docs", "verification", "rendered-plans"),
  webPublic: join(repoRoot, "apps", "web", "public"),
  webSource: join(repoRoot, "apps", "web", "src"),
  apiRoutes: join(repoRoot, "apps", "api", "app", "routes")
};

const repoRelativePath = (path) => path.replace(repoRoot, "").replace(/\\/g, "/").replace(/^\/+/, "");
const failures = [];
const evidence = {
  sourceManifest: {
    file: repoRelativePath(manifestPath),
    requiredFieldsMissing: [],
    sourceDocumentPathViolations: []
  },
  repoDocxFiles: [],
  webSourceMatches: [],
  apiRouteMatches: [],
  correctedPlanReviewMatches: []
};

const prohibitedWebPatterns = [
  /\.(?:docx|DOCX)\b/,
  /docs\/floorplans/i,
  /sourceDocumentPath/i
];

const prohibitedApiPatterns = [
  /\.(?:docx|DOCX)\b/,
  /docs\/floorplans/i,
  /sourceDocumentPath/i
];

const repoDocxFiles = listFilesContainingDocx();
if (repoDocxFiles.length > 0) {
  evidence.repoDocxFiles = repoDocxFiles;
  failures.push(
    `Found ${repoDocxFiles.length} committed/public DOCX artifacts; they must be removed from the product repo`
  );
}

const webMatches = scanTextFiles(repoPaths.webSource, prohibitedWebPatterns);
if (webMatches.length > 0) {
  evidence.webSourceMatches = webMatches;
  failures.push("Web source references found for DOCX or docs/floorplans fields that must not render/import/serve");
}

const apiMatches = scanTextFiles(repoPaths.apiRoutes, prohibitedApiPatterns);
if (apiMatches.length > 0) {
  evidence.apiRouteMatches = apiMatches;
  failures.push("API routes contain DOCX or source-document serving patterns");
}

const correctedMatches = scanCorrectedPlanReviewArtifacts();
if (correctedMatches.length > 0) {
  evidence.correctedPlanReviewMatches = correctedMatches;
  failures.push("Corrected-plan review artifacts contain forbidden private-source data or exact-parity claims");
}

validateSourceManifest();

if (failures.length > 0) {
  console.error(
    JSON.stringify(
      {
        status: "failed",
        failures,
        ...evidence
      },
      null,
      2
    )
  );
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      status: "passed",
      ...evidence
    },
    null,
    2
  )
);

function validateSourceManifest() {
  if (!existsSync(manifestPath)) {
    throw new Error(`Missing source layout manifest: ${manifestPath}`);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const requiredFields = new Set([
    "sourcePlanId",
    "sourceArtifactId",
    "sourceRevision",
    "sourceCapturedAt",
    "sourceType",
    "sourceVisibility",
    "publicExposureAllowed",
    "runtimeServedByWeb",
    "runtimeServedByApi",
    "sourceSha256",
    "sourceSha256Status",
    "defaultPlanId",
    "conversionOutputPlanId",
    "sourceFilename",
    "sourceDocumentPath",
    "defaultPlanName",
    "conversionStatus",
    "auditStatus",
    "nonPhiStatus",
    "limitations"
  ]);

  if (!Array.isArray(manifest.sources)) {
    evidence.sourceManifest.requiredFieldsMissing.push("manifest.sources must be an array");
    failures.push("manifest.sources must be an array");
    return;
  }

  for (const source of manifest.sources) {
    for (const field of requiredFields) {
      if (!(field in source)) {
        evidence.sourceManifest.requiredFieldsMissing.push(`${source.sourcePlanId ?? "unknown"}.${field}`);
        failures.push(`Missing manifest field ${field}`);
      }
    }
    if (!(
      source.sourceVisibility === "private-reference-only" &&
      source.publicExposureAllowed === false &&
      source.runtimeServedByWeb === false &&
      source.runtimeServedByApi === false
    )) {
      failures.push(
        `source ${source.sourcePlanId} visibility flags must be private-reference-only and false runtime exposure flags`
      );
    }

    if (
      source.sourceDocumentPath !== null &&
      source.sourceDocumentPath !== undefined &&
      typeof source.sourceDocumentPath === "string"
    ) {
      evidence.sourceManifest.sourceDocumentPathViolations.push(source.sourcePlanId);
      failures.push(
        `sourceDocumentPath must be null/removed for ${source.sourcePlanId} to prevent public-path coupling`
      );
    }

    if (
      typeof source.sourceDocumentPath === "string" &&
      (source.sourceDocumentPath.toLowerCase().includes("docs/floorplans") ||
        source.sourceDocumentPath.toLowerCase().includes("apps/web/public"))
    ) {
      evidence.sourceManifest.sourceDocumentPathViolations.push(source.sourcePlanId);
      failures.push(
        `sourceDocumentPath for ${source.sourcePlanId} references forbidden path ${source.sourceDocumentPath}`
      );
    }
  }
}

function listFilesContainingDocx() {
  const files = [];
  for (const path of [
    repoPaths.docsFloorplans,
    repoPaths.webPublic
  ]) {
    if (!existsSync(path)) {
      continue;
    }
    for (const file of listFiles(path)) {
      if (file.toLowerCase().endsWith(".docx")) {
        files.push(repoRelativePath(file));
      }
    }
  }
  return files.sort();
}

function scanTextFiles(directory, patterns) {
  if (!existsSync(directory)) {
    return [];
  }
  const matches = [];
  for (const file of listFiles(directory)) {
    const text = readFileMaybe(file);
    if (text == null) {
      continue;
    }
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        matches.push(repoRelativePath(file));
        break;
      }
    }
  }
  return [...new Set(matches)].sort();
}

function scanCorrectedPlanReviewArtifacts() {
  const roots = [
    repoPaths.correctedSourceCorrections,
    repoPaths.correctedRenderedPlans,
    repoPaths.correctedReviewManifest,
    repoPaths.manualReviewManifest,
    repoPaths.manualReviewDocs,
    repoPaths.promotionDryRunDocs
  ];
  const patterns = [
    /\.(?:docx|DOCX)\b/,
    /[A-Za-z]:[\\/][^\s"]+/u,
    /\bsourceFilename\b|\bsource filename:/i,
    /\bocr(?:Dump|Text)\b|OCR dump:/i,
    /\brawSourceText\b|raw source text:/i,
    /\bprivateSourceScreenshotStored\s*:\s*true\b|private-source screenshot:/i,
    /exact (?:CAD|DOCX) parity (?:achieved|confirmed|passed|approved)/i
  ];
  const matches = [];
  for (const rootPath of roots) {
    if (!existsSync(rootPath)) {
      continue;
    }
    const files = statSync(rootPath).isFile() ? [rootPath] : listFiles(rootPath);
    for (const file of files) {
      if (file.toLowerCase().endsWith(".png")) {
        continue;
      }
      const text = readFileMaybe(file);
      if (text == null) {
        continue;
      }
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          matches.push(repoRelativePath(file));
          break;
        }
      }
    }
  }
  return [...new Set(matches)].sort();
}

function listFiles(directory) {
  const paths = [];
  for (const dirent of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = join(directory, dirent.name);
    if (dirent.isDirectory()) {
      paths.push(...listFiles(absolutePath));
    } else if (dirent.isFile()) {
      paths.push(absolutePath);
    }
  }
  return paths;
}

function readFileMaybe(path) {
  try {
    const stat = statSync(path);
    if (!stat.isFile() || stat.size > 2_000_000) {
      return null;
    }
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

const evidencePath = process.env.PRIVATE_SOURCE_EVIDENCE_PATH;
if (evidencePath != null && evidencePath.length > 0) {
  try {
    writeFileSync(join(repoRoot, evidencePath), `${JSON.stringify(evidence, null, 2)}\n`);
  } catch {
    // No-op if the optional evidence target is not writable.
  }
}
