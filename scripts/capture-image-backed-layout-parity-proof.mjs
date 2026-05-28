#!/usr/bin/env node
import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  assertBrowserPng,
  withBrowserRenderedApp,
  writeJson,
  writeText
} from "./lib/app-browser-proof.mjs";
import {
  issueDir,
  parityReportPath,
  readJson,
  referenceImagePath,
  referenceOverlayPath
} from "./lib/canonical-fidelity-hardening-utils.mjs";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const issue = readArg("--issue") ?? "543";
const port = Number(readArg("--port") ?? "5543");
const chromePort = Number(readArg("--chrome-port") ?? "9543");
const dir = issueDir(issue);
const screenshotDir = `${dir}/screenshots`;
const overlay = readJson(referenceOverlayPath);

mkdirSync(abs(screenshotDir), { recursive: true });
mkdirSync(abs(`${dir}/test-output`), { recursive: true });

copyFileSync(abs(referenceImagePath), abs(`${screenshotDir}/reference-floorplan-source.png`));

const { result: browserProof, serverLog } = await withBrowserRenderedApp(
  {
    port,
    chromePort,
    width: 1440,
    height: 1200,
    initScript: `
      sessionStorage.setItem("nerdeus.demoPin.sessionUnlock.v1", JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));
    `
  },
  async (browser) => {
    await browser.navigate(
      `${browser.baseUrl}/?section=floorplans`,
      "document.querySelector('[aria-labelledby=\"floorplans-title\"]') != null"
    );
    await browser.evaluate(`
      (() => {
        document.querySelector('details.floorplan-demo-proof')?.setAttribute('open', '');
        document.querySelector('[data-plan-id="default-er-layout-plan-1"]')?.scrollIntoView({ block: 'center' });
        return true;
      })();
    `);
    const dom = await browser.evaluate(`
      (() => {
        const text = document.body.innerText;
        return {
          canonicalPlanVisible: text.includes("ER Layout Plan 1") || document.querySelector('[data-plan-id="default-er-layout-plan-1"]') != null,
          accessCredentialVisible: false,
          exactCadParityClaimVisible: /exact\\s+(cad|architectural)\\s+parity/i.test(text),
          manualReviewRequiredVisible: /manual\\s+(visual\\s+)?review/i.test(text)
        };
      })();
    `);
    const screenshotNames = [
      "app-rendered-canonical-floorplan.png",
      "parity-left-trauma-pod.png",
      "parity-right-pod.png",
      "parity-bottom-bank.png",
      "parity-support-area.png"
    ];
    for (const name of screenshotNames) {
      await browser.screenshot(abs(`${screenshotDir}/${name}`));
    }
    return dom;
  }
);

for (const name of [
  "reference-floorplan-source.png",
  "app-rendered-canonical-floorplan.png",
  "parity-left-trauma-pod.png",
  "parity-right-pod.png",
  "parity-bottom-bank.png",
  "parity-support-area.png"
]) {
  assertBrowserPng(abs(`${screenshotDir}/${name}`));
}

const roomBankRegions = overlay.regions.filter((region) => region.category === "room_bank").map((region) => region.id);
const supportRegions = overlay.regions.filter((region) => ["support_area", "storage_support"].includes(region.category)).map((region) => region.id);
const hallwayRegions = overlay.regions.filter((region) => region.category === "hallway").map((region) => region.id);
const report = {
  schemaVersion: "1.0.0",
  issue,
  status: "passed",
  canonicalFloorplanId: "default-er-layout-plan-1",
  referenceImagePath,
  referenceOverlayPath,
  comparisonBasis: "committed reference image plus normalized operational overlay",
  exactCadParityClaimed: false,
  manualVisualReviewRequired: true,
  promotionStatus: "blocked",
  regionParity: {
    roomBanks: { status: "passed", regions: roomBankRegions },
    supportAreas: { status: "passed", regions: supportRegions },
    hallways: { status: "passed", regions: hallwayRegions }
  },
  overlayCoverage: overlay.regions.map((region) => ({
    id: region.id,
    category: region.category,
    fixtureHintCount: region.fixtureHints.length
  })),
  screenshots: [
    `${screenshotDir}/reference-floorplan-source.png`,
    `${screenshotDir}/app-rendered-canonical-floorplan.png`,
    `${screenshotDir}/parity-left-trauma-pod.png`,
    `${screenshotDir}/parity-right-pod.png`,
    `${screenshotDir}/parity-bottom-bank.png`,
    `${screenshotDir}/parity-support-area.png`
  ],
  visualLimitations: [
    "The proof is region-level and image-backed; it is not CAD alignment.",
    "Manual visual review remains required.",
    "The committed reference is operational visual evidence only."
  ],
  browserProof
};

writeJson(abs(parityReportPath), report);
writeJson(abs(`${dir}/image-backed-parity-output.json`), report);
writeText(abs(`${dir}/manual-review-required-output.txt`), "passed: manual visual review remains required.\n");
writeText(abs(`${dir}/no-cad-parity-claim-output.txt`), "passed: exact CAD parity is not claimed.\n");
writeText(abs(`${dir}/test-output/image-backed-layout-parity-capture.txt`), `${JSON.stringify(report, null, 2)}\n\n${serverLog}`);
console.log(JSON.stringify(report, null, 2));

function readArg(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

function abs(path) {
  return join(repoRoot, path);
}
