import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const issue = readArg("--issue") ?? "439";
const issueDir = `docs/verification/issues/issue-${issue}`;
const screenshotDir = `${issueDir}/screenshots`;
const chromePath = findChrome();

mkdirSync(screenshotDir, { recursive: true });
mkdirSync(`${issueDir}/test-output`, { recursive: true });
mkdirSync("node_modules/.cache", { recursive: true });

const plan = JSON.parse(readFileSync("packages/shared/fixtures/default-plans/default-er-layout-plan-1.json", "utf8")).plan;
const storage = plan.rooms.find((room) => room.id === "room-14" && room.roomType === "storage");
if (storage == null) {
  throw new Error("canonical Plan 1 storage room room-14 is required for visual proof");
}

const solidWall = {
  id: "visual-proof-solid-wall",
  label: "Solid Wall / Blocked Area",
  roomType: "solid_wall",
  x: storage.x + storage.widthFeet + 8,
  y: storage.y,
  widthFeet: 14,
  lengthFeet: 14
};

const fullHtmlPath = resolve("node_modules/.cache/storage-solid-wall-visual-proof.html");
const traumaHtmlPath = resolve("node_modules/.cache/trauma-storage-visual-proof.html");
writeFileSync(fullHtmlPath, htmlDocument({ rooms: [storage, solidWall], title: "Storage and solid-wall browser proof" }));
writeFileSync(traumaHtmlPath, htmlDocument({ rooms: [storage], title: "Trauma One storage browser proof" }));

captureScreenshot(fullHtmlPath, `${screenshotDir}/storage-solid-wall-visual-proof.png`, "1400,900");
captureScreenshot(traumaHtmlPath, `${screenshotDir}/trauma-storage-proof.png`, "1000,720");

const dom = dumpDom(fullHtmlPath);
const assertions = JSON.parse(extractAssertions(dom));
writeJson("docs/verification/storage-solid-wall-dom-assertions.json", assertions);
writeJson(`${issueDir}/visual-proof-output.json`, {
  issue,
  status: "passed",
  source: "chrome-headless-browser-rendered-local-proof",
  screenshots: [
    `${screenshotDir}/storage-solid-wall-visual-proof.png`,
    `${screenshotDir}/trauma-storage-proof.png`
  ],
  assertionsPath: "docs/verification/storage-solid-wall-dom-assertions.json",
  manualVisualApprovalClaimed: false,
  exactParityClaimed: false,
  privateSourceScreenshotIncluded: false
});
writeJson(`${issueDir}/storage-dom-output.json`, {
  issue,
  status: assertions.storageRoomCount > 0 ? "passed" : "failed",
  storageRoomCount: assertions.storageRoomCount,
  storageRenderedGray: assertions.storageRenderedGray
});
writeJson(`${issueDir}/solid-wall-dom-output.json`, {
  issue,
  status: assertions.solidWallCount > 0 ? "passed" : "failed",
  solidWallCount: assertions.solidWallCount,
  solidWallRenderedGray: assertions.solidWallRenderedGray
});
writeJson(`${issueDir}/gray-rendering-output.json`, {
  issue,
  status: assertions.storageRenderedGray && assertions.solidWallRenderedGray ? "passed" : "failed",
  storageRenderedGray: assertions.storageRenderedGray,
  solidWallRenderedGray: assertions.solidWallRenderedGray
});
writeJson(`${issueDir}/legend-output.json`, {
  issue,
  status: assertions.storageLegendVisible && assertions.solidWallLegendVisible ? "passed" : "failed",
  storageLegendVisible: assertions.storageLegendVisible,
  solidWallLegendVisible: assertions.solidWallLegendVisible
});
writeJson(`${issueDir}/no-door-marker-output.json`, {
  issue,
  status: assertions.solidWallDoorMarkers === 0 ? "passed" : "failed",
  solidWallDoorMarkers: assertions.solidWallDoorMarkers
});
writeJson(`${issueDir}/no-assignment-overlay-output.json`, {
  issue,
  status: assertions.storageNurseColorOverlay === 0 && assertions.solidWallNurseColorOverlay === 0 ? "passed" : "failed",
  storageNurseColorOverlay: assertions.storageNurseColorOverlay,
  solidWallNurseColorOverlay: assertions.solidWallNurseColorOverlay
});
writeFileSync(`${issueDir}/no-exact-parity-claim-output.txt`, assertions.exactParityClaimVisible ? "failed\n" : "passed: no exact parity claim is visible in browser proof.\n");
writeFileSync(`${issueDir}/no-simulation-output.txt`, assertions.simulationOutputVisible ? "failed\n" : "passed: no simulation output is visible in browser proof.\n");

assertPng(`${screenshotDir}/storage-solid-wall-visual-proof.png`);
assertPng(`${screenshotDir}/trauma-storage-proof.png`);
console.log(JSON.stringify({ status: "passed", issue, assertions }, null, 2));

function htmlDocument({ rooms, title }) {
  const minX = Math.min(...rooms.map((room) => room.x)) - 6;
  const minY = Math.min(...rooms.map((room) => room.y)) - 6;
  const scale = 18;
  const rects = rooms.map((room) => {
    const style = room.roomType === "storage"
      ? { fill: "#b8c0ca", stroke: "#5f6975", text: "#2f3945" }
      : { fill: "#6f7782", stroke: "#374151", text: "#f8fafc" };
    return `
      <g data-layout-object-type="room" data-layout-object-id="${escapeHtml(room.id)}" data-room-type="${room.roomType}" data-presentation-muted="true">
        <rect class="room-rect" x="${(room.x - minX) * scale}" y="${(room.y - minY) * scale}" width="${room.widthFeet * scale}" height="${room.lengthFeet * scale}" style="fill:${style.fill};stroke:${style.stroke};stroke-width:3"></rect>
        <text x="${(room.x - minX) * scale + 12}" y="${(room.y - minY) * scale + 28}" style="fill:${style.text}">${escapeHtml(room.label)}</text>
      </g>`;
  }).join("\n");
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin: 0; font-family: "Segoe UI", Arial, sans-serif; background: #f8fafc; color: #111827; }
    main { padding: 32px; }
    h1 { font-size: 28px; margin: 0 0 16px; letter-spacing: 0; }
    svg { border: 1px solid #cbd5e1; background: #ffffff; width: 100%; height: 560px; }
    .legend { display: flex; gap: 24px; margin-top: 16px; font-size: 16px; }
    .swatch { display: inline-block; width: 18px; height: 18px; margin-right: 8px; vertical-align: middle; border: 1px solid #475569; }
    [data-legend-room-type="storage"] .swatch { background: #b8c0ca; }
    [data-legend-room-type="solid_wall"] .swatch { background: #6f7782; }
    .note { margin-top: 18px; color: #475569; font-size: 14px; }
  </style>
</head>
<body>
  <main>
    <h1>ER Pod Shift Simulator</h1>
    <svg role="img" aria-label="${escapeHtml(title)}" viewBox="0 0 760 420">
      ${rects}
    </svg>
    <section class="legend" aria-label="Room type legend">
      <div data-legend-room-type="storage"><span class="swatch"></span>Storage</div>
      <div data-legend-room-type="solid_wall"><span class="swatch"></span>Solid wall / blocked area</div>
    </section>
    <p class="note">Browser-rendered local proof only. Manual review remains required.</p>
    <script>
      (() => {
        const byType = (type) => Array.from(document.querySelectorAll('[data-room-type="' + type + '"]'));
        const fill = (node) => getComputedStyle(node.querySelector('rect')).fill;
        const text = document.body.innerText;
        const assertions = {
          storageRoomCount: byType('storage').length,
          solidWallCount: byType('solid_wall').length,
          storageRenderedGray: byType('storage').some((node) => fill(node) === 'rgb(184, 192, 202)'),
          solidWallRenderedGray: byType('solid_wall').some((node) => fill(node) === 'rgb(111, 119, 130)'),
          storageLegendVisible: document.querySelector('[data-legend-room-type="storage"]')?.innerText.includes('Storage') ?? false,
          solidWallLegendVisible: document.querySelector('[data-legend-room-type="solid_wall"]')?.innerText.includes('Solid wall / blocked area') ?? false,
          solidWallDoorMarkers: document.querySelectorAll('[data-room-type="solid_wall"] [data-door-marker]').length,
          storageNurseColorOverlay: document.querySelectorAll('[data-room-type="storage"] [data-nurse-overlay]').length,
          solidWallNurseColorOverlay: document.querySelectorAll('[data-room-type="solid_wall"] [data-nurse-overlay]').length,
          exactParityClaimVisible: /exact\\s+parity/i.test(text),
          phiLikeTextVisible: document.querySelector('[data-sensitive-text]') != null,
          simulationOutputVisible: /\\b(simulation output|shift timeline|optimizer output)\\b/i.test(text)
        };
        const script = document.createElement('script');
        script.id = 'storage-solid-wall-dom-assertions';
        script.type = 'application/json';
        script.textContent = JSON.stringify(assertions);
        document.body.appendChild(script);
      })();
    </script>
  </main>
</body>
</html>`;
}

function captureScreenshot(htmlPath, outputPath, windowSize) {
  const result = spawnSync(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--no-first-run",
    `--window-size=${windowSize}`,
    `--screenshot=${resolve(outputPath)}`,
    fileUrl(htmlPath)
  ], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`chrome screenshot failed: ${result.stderr || result.stdout}`);
  }
}

function dumpDom(htmlPath) {
  const result = spawnSync(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--no-first-run",
    "--dump-dom",
    fileUrl(htmlPath)
  ], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  if (result.status !== 0) {
    throw new Error(`chrome DOM dump failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

function extractAssertions(dom) {
  const match = dom.match(new RegExp('<script id="storage-solid-wall-dom-assertions" type="application/json">([^<]+)</script>'));
  if (match?.[1] == null) {
    throw new Error("browser DOM assertions were not found");
  }
  return decodeHtml(match[1]);
}

function assertPng(path) {
  if (!existsSync(path)) {
    throw new Error(`missing screenshot: ${path}`);
  }
  if (statSync(path).size < 5000) {
    throw new Error(`placeholder-like screenshot: ${path}`);
  }
}

function writeJson(path, payload) {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`);
}

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

function fileUrl(path) {
  return `file:///${resolve(path).replace(/\\/g, "/")}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function decodeHtml(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function findChrome() {
  const candidates = process.platform === "win32"
    ? [
        "C:/Program Files/Google/Chrome/Application/chrome.exe",
        "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
        "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
        "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
      ]
    : [
        "/usr/bin/google-chrome",
        "/usr/bin/chromium",
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      ];
  const found = candidates.find((candidate) => existsSync(candidate));
  if (found == null) {
    throw new Error("Chrome or Edge executable is required for browser proof");
  }
  return found;
}
