import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const sharedBuildPath = resolve("packages/shared/dist/index.js");

if (!existsSync(sharedBuildPath)) {
  console.error("Shared package build output missing. Run:");
  console.error("npm --workspace @nerdeus/shared run build");
  process.exit(1);
}

const { validatePlanContract } = await import(pathToFileURL(sharedBuildPath).href);

const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: node scripts/validate-plan-contract.mjs <plan-json-file>");
  process.exit(2);
}

try {
  const resolvedPath = resolve(filePath);
  const raw = readFileSync(resolvedPath, "utf8");
  const parsed = JSON.parse(raw);
  const plan = validatePlanContract(parsed);

  console.log("Plan contract validation: PASS");
  console.log(`plan ID: ${plan.planId}`);
  console.log(`plan name: ${plan.name}`);
  console.log(`room count: ${plan.rooms.length}`);
  console.log(`hallway count: ${plan.hallways.length}`);
  console.log(`path node count: ${plan.pathNodes.length}`);
  console.log(`path edge count: ${plan.pathEdges.length}`);
} catch (error) {
  console.error("Plan contract validation: FAIL");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
