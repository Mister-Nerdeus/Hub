import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { scoreRoomLoad, validateRoomLoads } from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

const cases = readFixture("scoring/room-workload-cases.json");

for (const scoringCase of cases) {
  test(`scoreRoomLoad: ${scoringCase.name}`, () => {
    const [roomLoad] = validateRoomLoads([scoringCase.roomLoad]);
    const score = scoreRoomLoad(roomLoad);

    assert.deepEqual(
      {
        acuityPoints: score.acuityPoints,
        traumaPoints: score.traumaPoints,
        isolationPoints: score.isolationPoints,
        behavioralPoints: score.behavioralPoints,
        fallRiskPoints: score.fallRiskPoints,
        sitterPoints: score.sitterPoints,
        medicationPoints: score.medicationPoints,
        monitoringPoints: score.monitoringPoints,
        procedurePoints: score.procedurePoints,
        totalRoomBurden: score.totalRoomBurden
      },
      scoringCase.expected
    );
  });
}
