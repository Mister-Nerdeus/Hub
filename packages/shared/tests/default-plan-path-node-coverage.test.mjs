import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { auditDefaultPlanPathNodeCoverage } from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const defaultPlansDir = join(repoRoot, "packages", "shared", "fixtures", "default-plans");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-218");

function readPlan(index) {
  return JSON.parse(
    readFileSync(join(defaultPlansDir, `default-er-layout-plan-${index}.json`), "utf8")
  ).plan;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

test("all default plans pass path-node coverage audit", () => {
  const audits = [1, 2, 3, 4, 5].map((index) => auditDefaultPlanPathNodeCoverage(readPlan(index)));
  for (const audit of audits) {
    assert.equal(audit.status, "passed", `${audit.planId} gaps: ${JSON.stringify(audit.gaps)}`);
    assert.equal(audit.gaps.length, 0);
    assert.ok(audit.counts.rooms > 0);
    assert.ok(audit.counts.entries > 0);
  }

  writeEvidence("default-plan-path-node-coverage-output.json", {
    issue: "218",
    status: "passed",
    audits
  });
});

test("path-node coverage audit reports broken references and wrong node types", () => {
  const cases = [];

  const missingDoorPathNode = clone(readPlan(1));
  missingDoorPathNode.doors[0].pathNodeId = "node-missing";
  cases.push(["missing door path node", missingDoorPathNode, "MISSING_DOOR_PATH_NODE"]);

  const missingRoomPathNode = clone(readPlan(1));
  missingRoomPathNode.rooms[0].pathNodeId = null;
  cases.push(["missing room path node", missingRoomPathNode, "MISSING_ROOM_PATH_NODE"]);

  const wrongRoomDoorLink = clone(readPlan(1));
  const firstRoomNode = wrongRoomDoorLink.pathNodes.find((node) => node.id === wrongRoomDoorLink.rooms[0].pathNodeId);
  firstRoomNode.linkedObjectId = wrongRoomDoorLink.doors[1].id;
  cases.push(["wrong room door linkedObjectId", wrongRoomDoorLink, "ROOM_DOOR_NODE_LINKS_WRONG_ROOM"]);

  const stationPointsToRoomDoor = clone(readPlan(1));
  stationPointsToRoomDoor.nurseStations[0].pathNodeId = stationPointsToRoomDoor.rooms[0].pathNodeId;
  cases.push(["station pathNodeId points to room door", stationPointsToRoomDoor, "STATION_PATH_NODE_NOT_STATION"]);

  const hallwayWithoutAnchor = clone(readPlan(1));
  hallwayWithoutAnchor.pathNodes = hallwayWithoutAnchor.pathNodes.filter(
    (node) => node.linkedObjectId !== "hallway-ems-entry"
  );
  cases.push(["hallway without anchor", hallwayWithoutAnchor, "HALLWAY_WITHOUT_ANCHOR_NODE"]);

  const entrySelfReference = clone(readPlan(1));
  const entryNode = entrySelfReference.pathNodes.find((node) => node.nodeType === "entry");
  entryNode.entryOperationalMetadata.linkedPathNodeId = entryNode.id;
  cases.push(["entry node self-reference", entrySelfReference, "ENTRY_NODE_SELF_REFERENCE"]);

  const negativeResults = cases.map(([name, plan, expectedCode]) => {
    const audit = auditDefaultPlanPathNodeCoverage(plan);
    assert.equal(audit.status, "failed", name);
    assert.equal(audit.gaps.some((gap) => gap.code === expectedCode), true, name);
    return {
      name,
      expectedCode,
      gapCodes: audit.gaps.map((gap) => gap.code)
    };
  });

  writeEvidence("broken-path-node-negative-output.json", {
    issue: "218",
    status: "passed",
    negativeResults
  });
});
