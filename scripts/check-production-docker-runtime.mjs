import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const composeFile = "docker-compose.production.yml";
const nginxFile = "apps/web/nginx.production.conf";
const webDockerfile = "apps/web/Dockerfile.production";
const apiDockerfile = "apps/api/Dockerfile.production";
const projectName = "hub-production-runtime-check";
const smokePort = process.env.PRODUCTION_DOCKER_SMOKE_PORT ?? "5191";
const runSmoke = process.argv.includes("--smoke");

const failures = [];

const compose = read(composeFile);
const nginx = read(nginxFile);
const webDocker = read(webDockerfile);
const apiDocker = read(apiDockerfile);

mustInclude(compose, "apps/api/Dockerfile.production", `${composeFile} must use the production API Dockerfile`);
mustInclude(compose, "apps/web/Dockerfile.production", `${composeFile} must use the production web Dockerfile`);
mustNotInclude(compose, "Dockerfile.local", `${composeFile} must not use local development Dockerfiles`);
mustInclude(compose, "${WEB_HOST_PORT:-80}:80", `${composeFile} must publish the nginx container port 80`);

mustInclude(nginx, "root /usr/share/nginx/html;", `${nginxFile} must serve built web assets`);
mustInclude(nginx, "location = /health", `${nginxFile} must proxy exact /health to the API`);
mustInclude(nginx, "location = /v1", `${nginxFile} must proxy exact /v1 instead of serving SPA HTML`);
mustInclude(nginx, "location /v1/", `${nginxFile} must proxy /v1/ API routes`);
mustInclude(nginx, "try_files $uri $uri/ /index.html;", `${nginxFile} must keep SPA fallback for non-API routes`);

mustInclude(webDocker, "FROM nginx:", `${webDockerfile} must serve production output with nginx`);
mustInclude(webDocker, "org.opencontainers.image.title=\"ER Pod Shift Simulator\"", `${webDockerfile} must carry the product container label`);
mustInclude(webDocker, "no PHI or EHR integration", `${webDockerfile} must carry the non-PHI/EHR boundary label`);
mustInclude(webDocker, "org.opencontainers.image.revision=\"geometry-truth-hardening-815-830\"", `${webDockerfile} must carry the geometry truth hardening batch revision label`);
mustInclude(webDocker, "npm --workspace apps/web run build", `${webDockerfile} must build static assets`);
mustInclude(webDocker, "nginx.production.conf", `${webDockerfile} must copy the production nginx config`);
mustNotInclude(webDocker, "npm run dev", `${webDockerfile} must not run the Vite development server`);
mustNotInclude(webDocker, "vite --host", `${webDockerfile} must not run the Vite development server`);

mustInclude(apiDocker, "COPY apps/api/alembic.ini", `${apiDockerfile} must include Alembic config`);
mustInclude(apiDocker, "COPY apps/api/alembic", `${apiDockerfile} must include migration scripts`);
mustInclude(apiDocker, "org.opencontainers.image.title=\"ER Pod Shift Simulator API\"", `${apiDockerfile} must carry the API product container label`);
mustInclude(apiDocker, "no PHI or EHR integration", `${apiDockerfile} must carry the non-PHI/EHR boundary label`);
mustInclude(apiDocker, "org.opencontainers.image.revision=\"geometry-truth-hardening-815-830\"", `${apiDockerfile} must carry the geometry truth hardening batch revision label`);

if (failures.length === 0 && runSmoke) {
  await runProductionSmoke();
}

if (failures.length > 0) {
  console.error(JSON.stringify({ status: "failed", failures }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      status: "passed",
      smoke: runSmoke ? "passed" : "not-run",
      composeFile,
      nginxFile,
      webDockerfile,
      apiDockerfile
    },
    null,
    2
  )
);

function read(path) {
  return readFileSync(path, "utf8");
}

function mustInclude(text, expected, message) {
  if (!text.includes(expected)) {
    failures.push(message);
  }
}

function mustNotInclude(text, forbidden, message) {
  if (text.includes(forbidden)) {
    failures.push(message);
  }
}

async function runProductionSmoke() {
  const env = { ...process.env, WEB_HOST_PORT: smokePort };
  try {
    run("docker", ["compose", "-p", projectName, "-f", composeFile, "down", "-v"], env, { allowFailure: true });
    run("docker", ["compose", "-p", projectName, "-f", composeFile, "up", "--build", "-d"], env);
    run("docker", ["compose", "-p", projectName, "-f", composeFile, "--profile", "tools", "run", "--rm", "migrate"], env);

    const root = await text(`http://localhost:${smokePort}/`);
    if (root.includes("/@vite/client") || root.includes("/src/main.tsx")) {
      failures.push("production web root must not serve Vite development HTML");
    }
    if (!root.includes("/assets/")) {
      failures.push("production web root must reference built static assets");
    }

    const health = await json(`http://localhost:${smokePort}/health`);
    if (health.status !== "ok" || health.service !== "nerdeus-api") {
      failures.push("production /health must proxy to the API health endpoint");
    }

    const plans = await json(`http://localhost:${smokePort}/v1/plans`);
    if (!Array.isArray(plans.plans)) {
      failures.push("production /v1/plans must proxy to the API and return a plans array");
    }

    const v1 = await fetch(`http://localhost:${smokePort}/v1`);
    const v1Text = await v1.text();
    if (v1Text.includes("<!doctype html>") || v1Text.includes("/assets/")) {
      failures.push("production exact /v1 must not return SPA HTML");
    }
  } finally {
    run("docker", ["compose", "-p", projectName, "-f", composeFile, "down", "-v"], env, { allowFailure: true });
  }
}

function run(command, args, env, options = {}) {
  const result = spawnSync(command, args, {
    env,
    shell: false,
    stdio: "inherit"
  });
  if (result.status !== 0 && !options.allowFailure) {
    throw new Error(`${command} ${args.join(" ")} failed with status ${result.status}`);
  }
}

async function text(url) {
  const response = await fetch(url);
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}: ${body}`);
  }
  return body;
}

async function json(url) {
  const body = await text(url);
  return JSON.parse(body);
}
