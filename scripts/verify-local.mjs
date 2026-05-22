import { spawnSync } from "node:child_process";

const commands = [
  "docker compose config",
  "node scripts/check-no-phi-fields.mjs",
  "node scripts/check-docs-contracts.mjs",
  "npm --workspace packages/shared test",
  "python -m pytest apps/api/tests",
  "npm --workspace apps/web run build"
];

for (const command of commands) {
  console.log(`\n> ${command}`);
  const result = spawnSync(command, {
    shell: true,
    stdio: "inherit"
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
