#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  readArg,
  statusFromChecks,
  updateRouteManifest,
  writeCloseout,
  writeCommandArtifacts,
  writeJson,
  writeStageResult
} from "./lib/route-graph-foundation-utils.mjs";

const issue = readArg("--issue", "845");
const stage = readArg("--stage", "final");
const scriptName = "check-canonical-er-pod-geometry-fixture";
const dir = `docs/verification/issues/issue-${issue}`;
const commands = [`node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`];
ensureIssueArtifacts(issue);
writeCommandArtifacts(issue, commands);

const { canonicalErPodGeometryFixture } = await import("../packages/shared/dist/index.js");
const fixture = canonicalErPodGeometryFixture;
const hasSplitRoom = (fixture.splitRooms ?? []).some((splitRoom) => splitRoom.bedPositions.length >= 2);
const hasExplicitUnknown = (fixture.doorDestinations ?? []).some((destination) => destination.leadsToKind === "unknown");
const hasNormalRooms = fixture.rooms.some((room) => room.roomType === "standard");
const hasSupport = fixture.rooms.some((room) => room.roomType === "storage") || fixture.zones.some((zone) => zone.zoneType === "provider_pharmacy");
const checks = [];
addCheck(checks, "fixture has normal rooms", hasNormalRooms, fixture.rooms);
addCheck(checks, "fixture has split room with two bed positions", hasSplitRoom, fixture.splitRooms);
addCheck(checks, "fixture has perimeter walls", (fixture.perimeterWalls ?? []).length > 0, fixture.perimeterWalls);
addCheck(checks, "fixture has entry exits", (fixture.entryExits ?? []).length > 0, fixture.entryExits);
addCheck(checks, "fixture has door destinations", (fixture.doorDestinations ?? []).length > 0, fixture.doorDestinations);
addCheck(checks, "fixture has hallways", fixture.hallways.length > 0, fixture.hallways);
addCheck(checks, "fixture has support or storage areas", hasSupport, { rooms: fixture.rooms, zones: fixture.zones });
addCheck(checks, "fixture has explicit unknown destination", hasExplicitUnknown, fixture.doorDestinations);
const status = statusFromChecks(checks);
writeJson(`${dir}/canonical-er-pod-geometry-fixture-output.json`, {
  status,
  canonicalErPodGeometryFixtureStatus: status,
  fixtureHasSplitRoom: hasSplitRoom,
  fixtureHasPerimeterWall: (fixture.perimeterWalls ?? []).length > 0,
  fixtureHasEntryExits: (fixture.entryExits ?? []).length > 0,
  fixtureHasDoorDestinations: (fixture.doorDestinations ?? []).length > 0,
  fixtureHasExplicitUnknownDestination: hasExplicitUnknown
});
writeJson(`${dir}/canonical-er-pod-geometry-fixture.json`, fixture);
writeJson(`${dir}/assignment-target-fixture-proof.json`, {
  status,
  splitRoomBedPositions: (fixture.splitRooms ?? []).flatMap((splitRoom) => splitRoom.bedPositions.map((bedPosition) => ({
    bedPositionId: bedPosition.bedPositionId,
    assignmentTarget: bedPosition.assignmentTarget,
    note: "Geometry fixture metadata only; no assignment recommendation is present."
  })))
});
if (status === "passed") {
  updateRouteManifest(issue, { canonicalErPodGeometryFixtureStatus: "passed" });
}
writeCloseout(issue, {
  title: "Canonical ER Pod Geometry Fixture",
  reviewFinding: "Canonical synthetic fixture now includes rooms, a split-room parent with two bed positions, perimeter walls, entries/exits, door destinations, hallways, support/storage areas, and an explicit unknown destination warning case.",
  status,
  filesChanged: ["packages/shared/src/floorplans/canonicalErPodGeometryFixture.ts", "packages/shared/src/floorplans/floorplanGeometryContract.ts", "scripts/check-canonical-er-pod-geometry-fixture.mjs", `${dir}/`],
  commands,
  evidence: [`${dir}/canonical-er-pod-geometry-fixture-output.json`, `${dir}/canonical-er-pod-geometry-fixture.json`, `${dir}/assignment-target-fixture-proof.json`],
  limitations: ["Fixture is geometry-only and does not contain simulation output, burden scoring, persistence, or assignment recommendations."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);
