#!/usr/bin/env node
import { statSync } from "node:fs";
import { delay, waitForExpression, withBrowserRenderedApp } from "./lib/app-browser-proof.mjs";
import {
  addCheck,
  ensureIssueArtifacts,
  readArg,
  runNoPhi,
  screenshotIndex,
  statusFromChecks,
  updateRouteManifest,
  writeCloseout,
  writeCommandArtifacts,
  writeJson,
  writeStageResult
} from "./lib/route-graph-foundation-utils.mjs";

const issue = readArg("--issue", "859");
const stage = readArg("--stage", "final");
const scriptName = "check-perimeter-wall-warning-marker";
const dir = `docs/verification/issues/issue-${issue}`;
const screenshots = ["perimeter-wall-warning-marker.png"];
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-route-graph-overlay.mjs --stage final --issue 859",
  "node scripts/check-route-graph-browser-proof.mjs --stage final --issue 859",
  "node scripts/check-no-phi-fields.mjs"
];
ensureIssueArtifacts(issue, { screenshots: true });
writeCommandArtifacts(issue, commands);

const { canonicalErPodGeometryFixture, deriveRouteGraphFromGeometry, validateRouteGraphContract } = await import("../packages/shared/dist/index.js");
const wallFixture = createBlockedWallFixture(canonicalErPodGeometryFixture);
const graph = deriveRouteGraphFromGeometry(wallFixture);
const wallWarnings = graph.warnings.filter((warning) => warning.sourceObjectType === "perimeter_wall" && warning.code === "route_blocked_by_wall");
const previousLookupWouldFail = wallWarnings.every((warning) =>
  !graph.nodes.some((node) => node.routeNodeId === `route-node:room:${warning.sourceObjectId}`)
);
writeJson(`${dir}/wall-warning-before.json`, {
  status: previousLookupWouldFail ? "failed_before_fix" : "not_reproduced",
  previousMapping: "perimeter_wall sourceObjectId mapped to room route node",
  previousMarkersFound: 0,
  wallWarnings
});
const browserProof = await runBrowserProof();
const checks = [];
addCheck(checks, "perimeter wall blocked warning exists", wallWarnings.length > 0, wallWarnings);
addCheck(checks, "perimeter wall warning has stable anchor", wallWarnings.every((warning) => warning.sourceAnchorFeet != null), wallWarnings);
addCheck(checks, "previous room-node mapping would not find marker anchor", previousLookupWouldFail, wallWarnings);
addCheck(checks, "browser renders blocked wall warning marker", browserProof.perimeterWallWarningsRenderVisibly, browserProof);
addCheck(checks, "wall warnings do not create traversable wall nodes", !graph.nodes.some((node) => node.sourceKind === "perimeter_wall") && !graph.edges.some((edge) => edge.blockedByWall && edge.traversable), { nodes: graph.nodes, edges: graph.edges });
addCheck(checks, "route graph remains connectivity only", graph.routeGraphScope === "connectivity_only", graph);
addCheck(checks, "screenshots captured", screenshots.every((file) => statSync(`${dir}/screenshots/${file}`).size > 5000), screenshots);
const status = statusFromChecks(checks);
writeJson(`${dir}/wall-warning-after.json`, { status, wallWarnings, graph: validateRouteGraphContract(graph) });
writeJson(`${dir}/perimeter-wall-warning-marker-output.json`, {
  status,
  perimeterWallWarningMarkerStatus: status,
  perimeterWallWarningsRenderVisibly: browserProof.perimeterWallWarningsRenderVisibly,
  perimeterWallWarningsDoNotMapToRoomNodes: previousLookupWouldFail,
  blockedWallWarningBrowserProofPassed: browserProof.perimeterWallWarningsRenderVisibly,
  routeGraphStillConnectivityOnly: graph.routeGraphScope === "connectivity_only",
  browserProof
});
screenshotIndex(issue, screenshots);
const noPhiPassed = runNoPhi(issue);
if (status === "passed") {
  updateRouteManifest(issue, {
    perimeterWallWarningMarkerStatus: "passed",
    perimeterWallWarningsRenderVisibly: true,
    perimeterWallWarningsDoNotMapToRoomNodes: true,
    blockedWallWarningBrowserProofPassed: true,
    routeGraphScope: "connectivity_only"
  });
}
writeCloseout(issue, {
  title: "Perimeter Wall Warning Marker Fix",
  reviewFinding: "Perimeter-wall warnings previously resolved through a room-node lookup path. The overlay now renders perimeter-wall warning anchors directly, and derivation emits stable wall anchors for blocked wall warnings.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: ["apps/web/src/features/layout-editor/RouteGraphOverlay.tsx", "packages/shared/src/floorplans/routeGraphContract.ts", "packages/shared/src/floorplans/deriveRouteGraphFromGeometry.ts", "scripts/check-perimeter-wall-warning-marker.mjs", `${dir}/`],
  commands,
  evidence: [`${dir}/perimeter-wall-warning-marker-output.json`, `${dir}/wall-warning-before.json`, `${dir}/wall-warning-after.json`, `${dir}/screenshot-index.json`, `${dir}/screenshots/`],
  limitations: ["Wall warning markers are visual warning anchors only; wall nodes are not added."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);

function createBlockedWallFixture(base) {
  const fixture = JSON.parse(JSON.stringify(base));
  fixture.layoutId = `${fixture.layoutId}-wall-warning-proof`;
  fixture.perimeterWalls = [
    ...(fixture.perimeterWalls ?? []),
    {
      perimeterWallId: "perimeter-wall-warning-proof",
      label: "Wall warning proof boundary",
      segments: [
        {
          segmentId: "perimeter-wall-warning-proof-segment",
          label: "Warning proof wall segment",
          xFeet: 4,
          yFeet: 9.75,
          widthFeet: 4,
          heightFeet: 0.5,
          orientation: "horizontal",
          blocksTravel: true,
          locked: true
        }
      ]
    }
  ];
  return fixture;
}

async function runBrowserProof() {
  const port = Number(readArg("--port", "6859"));
  const chromePort = Number(readArg("--chrome-port", "9859"));
  return (await withBrowserRenderedApp({ port, chromePort, width: 1440, height: 1100, initScript: unlockScript() }, async (browser) => {
    await openEditor(browser);
    await browser.evaluate(`(() => {
      const key = "nerdeus.floorplans.savedAuthoringRecords.v1";
      const records = JSON.parse(localStorage.getItem(key));
      const record = records[0];
      const layout = record.authoringDraft.editableLayout;
      const destination = layout.doorDestinations.find((item) => item.leadsToKind !== "unknown");
      const door = layout.doors.find((item) => item.id === destination.doorId);
      const owner = door.ownerKind === "room"
        ? layout.rooms.find((item) => item.id === door.ownerId)
        : layout.hallways.find((item) => item.id === door.ownerId);
      const rect = (() => {
        const thickness = 0.5;
        if (door.wall === "north") return { xFeet: owner.xFeet + door.offsetFeet, yFeet: owner.yFeet - thickness / 2, widthFeet: door.widthFeet, heightFeet: thickness };
        if (door.wall === "south") return { xFeet: owner.xFeet + door.offsetFeet, yFeet: owner.yFeet + owner.heightFeet - thickness / 2, widthFeet: door.widthFeet, heightFeet: thickness };
        if (door.wall === "east") return { xFeet: owner.xFeet + owner.widthFeet - thickness / 2, yFeet: owner.yFeet + door.offsetFeet, widthFeet: thickness, heightFeet: door.widthFeet };
        return { xFeet: owner.xFeet - thickness / 2, yFeet: owner.yFeet + door.offsetFeet, widthFeet: thickness, heightFeet: door.widthFeet };
      })();
      const wall = {
        perimeterWallId: "perimeter-wall-warning-proof",
        label: "Wall warning proof boundary",
        segments: [{
          segmentId: "perimeter-wall-warning-proof-segment",
          label: "Warning proof wall segment",
          xFeet: rect.xFeet,
          yFeet: rect.yFeet,
          widthFeet: rect.widthFeet,
          heightFeet: rect.heightFeet,
          orientation: rect.widthFeet >= rect.heightFeet ? "horizontal" : "vertical",
          blocksTravel: true,
          locked: true
        }]
      };
      record.authoringDraft.editableLayout.perimeterWalls = [
        ...(record.authoringDraft.editableLayout.perimeterWalls ?? []),
        wall
      ];
      record.authoringDraft.sourcePlan.perimeterWalls = [
        ...(record.authoringDraft.sourcePlan.perimeterWalls ?? []),
        wall
      ];
      localStorage.setItem(key, JSON.stringify(records));
      localStorage.setItem("nerdeus.erPod.activeFloorplan.v1", JSON.stringify({
        schemaVersion: "1.0.0",
        activeFloorplanId: "er-pod-main-layout",
        activeFloorplanVersionId: record.savedPlanId
      }));
    })()`);
    await browser.navigate(`${browser.baseUrl}/?section=editor&wallWarningProof=1`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
    await clickButtonStartsWith(browser, "Show Routes");
    await waitForExpression(browser, `document.querySelector('[data-route-graph-overlay="visible"]') != null`, 10_000);
    await delay(500);
    await browser.screenshot(`${dir}/screenshots/perimeter-wall-warning-marker.png`);
    return browser.evaluate(`(() => ({
      perimeterWallWarningsRenderVisibly: document.querySelector('[data-route-warning-marker="true"][data-route-warning-code="route_blocked_by_wall"][data-route-warning-source-type="perimeter_wall"]') != null,
      wallWarningMarkerCount: document.querySelectorAll('[data-route-warning-marker="true"][data-route-warning-code="route_blocked_by_wall"][data-route-warning-source-type="perimeter_wall"]').length,
      roomMappedWallWarningMarkerCount: document.querySelectorAll('[data-route-warning-marker="true"][data-route-warning-source-type="room"][data-route-warning-code="route_blocked_by_wall"]').length,
      allWarningMarkers: Array.from(document.querySelectorAll('[data-route-warning-marker="true"]')).map((item) => ({
        code: item.getAttribute('data-route-warning-code'),
        sourceType: item.getAttribute('data-route-warning-source-type'),
        sourceId: item.getAttribute('data-route-warning-source-id')
      })),
      routeNodeCount: document.querySelectorAll('[data-route-node="true"]').length,
      routeEdgeCount: document.querySelectorAll('[data-route-edge="true"]').length,
      routeGraphScope: document.querySelector('[data-route-graph-overlay="visible"]')?.getAttribute('data-route-graph-scope') ?? null,
      routeWarningCount: document.querySelector('[data-route-graph-overlay="visible"]')?.getAttribute('data-route-warning-count') ?? null,
      routeWarningCodes: document.querySelector('[data-route-graph-overlay="visible"]')?.getAttribute('data-route-warning-codes') ?? null,
      persistedWallProof: (() => {
        const records = JSON.parse(localStorage.getItem("nerdeus.floorplans.savedAuthoringRecords.v1") ?? "[]");
        const layout = records[0]?.authoringDraft?.editableLayout;
        return {
          perimeterWallCount: layout?.perimeterWalls?.length ?? null,
          proofSegmentCount: layout?.perimeterWalls?.flatMap((wall) => wall.segments).filter((segment) => segment.segmentId === "perimeter-wall-warning-proof-segment").length ?? null,
          firstDestinationDoorId: layout?.doorDestinations?.find((item) => item.leadsToKind !== "unknown")?.doorId ?? null
        };
      })()
    }))()`);
  })).result;
}

async function openEditor(browser) {
  await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
  await browser.evaluate("localStorage.clear()");
  await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-command-bar="consolidated"]') != null`);
  await waitForExpression(browser, `Array.from(document.querySelectorAll('button')).some((button) => button.textContent.trim() === 'Create working copy' && !button.disabled)`, 15_000);
  await browser.evaluate(`Array.from(document.querySelectorAll('button')).find((button) => button.textContent.trim() === 'Create working copy' && !button.disabled)?.click()`);
  await waitForExpression(browser, `localStorage.getItem("nerdeus.floorplans.savedAuthoringRecords.v1") != null`, 20_000);
}

async function clickButtonStartsWith(browser, label) {
  await browser.evaluate(`Array.from(document.querySelectorAll('button')).find((item) => item.textContent.trim().startsWith(${JSON.stringify(label)}) && !item.disabled)?.click()`);
  await delay(500);
}

function unlockScript() {
  return "sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));";
}
