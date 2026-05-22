import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(webRoot, "../..");
const srcRoot = join(webRoot, "src");
const tempRoot = join(repoRoot, "node_modules", ".cache", "nerdeus-web-tests");
const tempTsconfig = join(tempRoot, "tsconfig.web-tests.json");

const testFiles = findTestFiles(srcRoot);
if (testFiles.length === 0) {
  console.error("No web test files found.");
  process.exit(1);
}

console.log(`Discovered ${testFiles.length} web test file(s).`);

runCommand("npm", ["--workspace", "@nerdeus/shared", "run", "build"], repoRoot);

rmSync(tempRoot, { recursive: true, force: true });
mkdirSync(tempRoot, { recursive: true });
writeFileSync(
  tempTsconfig,
  JSON.stringify(
    {
      extends: resolve(webRoot, "tsconfig.json"),
      compilerOptions: {
        noEmit: false,
        outDir: tempRoot,
        rootDir: srcRoot,
        declaration: false,
        sourceMap: false
      },
      include: [],
      files: testFiles
    },
    null,
    2
  )
);

runCommand("node", [resolve(repoRoot, "node_modules/typescript/bin/tsc"), "-p", tempTsconfig], repoRoot);
patchRelativeImports(tempRoot);

let failed = false;
for (const testFile of testFiles) {
  const relativeTestPath = relative(srcRoot, testFile).replace(/\\/g, "/");
  const compiledTestFile = join(tempRoot, relativeTestPath).replace(/\.ts$/, ".js");
  console.log(`\n> ${relative(webRoot, testFile).replace(/\\/g, "/")}`);
  const result = spawnSync(process.execPath, [compiledTestFile], {
    cwd: webRoot,
    stdio: "inherit"
  });
  if (result.status !== 0) {
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log(`\nExecuted ${testFiles.length} web test file(s).`);

function findTestFiles(directory) {
  const results = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      results.push(...findTestFiles(entryPath));
    } else if (entry.isFile() && entry.name.endsWith(".test.ts")) {
      results.push(entryPath);
    }
  }
  return results.sort();
}

function runCommand(command, args, cwd) {
  console.log(`\n> ${[command, ...args].join(" ")}`);
  const result = spawnSync(command, args, {
    cwd,
    shell: process.platform === "win32",
    stdio: "inherit"
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function patchRelativeImports(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      patchRelativeImports(entryPath);
      continue;
    }
    if (entry.isFile() && extname(entry.name) === ".js") {
      const source = readFileSync(entryPath, "utf8");
      const patched = source.replace(
        /((?:import|export)\s+(?:[^"']+\s+from\s+)?["'])(\.[^"']+)(["'])/g,
        (_match, prefix, specifier, suffix) => `${prefix}${resolveRelativeSpecifier(entryPath, specifier)}${suffix}`
      );
      writeFileSync(entryPath, patched);
    }
  }
}

function resolveRelativeSpecifier(importerPath, specifier) {
  if (extname(specifier) !== "") {
    return specifier;
  }

  const importerDir = dirname(importerPath);
  if (existsSync(resolve(importerDir, `${specifier}.js`))) {
    return `${specifier}.js`;
  }
  if (existsSync(resolve(importerDir, specifier, "index.js"))) {
    return `${specifier}/index.js`;
  }
  return specifier;
}
