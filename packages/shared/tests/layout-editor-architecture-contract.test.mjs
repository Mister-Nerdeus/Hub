import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

const requiredDocs = [
  {
    path: "docs/architecture/layout-editor-architecture.md",
    requiredPatterns: [
      /feet are source of truth/i,
      /pixels are display only/i,
      /stable IDs/i,
      /rooms/i,
      /doors/i,
      /nurse stations\/desks/i,
      /hallways/i,
      /EMS entry/i,
      /trauma zone/i,
      /provider\/pharmacy zone/i,
      /path graph/i,
      /simulation delta integration/i
    ]
  },
  {
    path: "docs/contracts/layout-editor-interaction-contract.md",
    requiredPatterns: [
      /selection/i,
      /snapping/i,
      /deterministic validation warnings/i,
      /path sync/i,
      /feet are source of truth/i,
      /pixels are display only/i
    ]
  },
  {
    path: "docs/contracts/layout-editor-geometry-invariants.md",
    requiredPatterns: [
      /valid geometry/i,
      /stable IDs/i,
      /no negative/i,
      /doors/i,
      /wall-attached/i,
      /path graph references/i,
      /feet are source of truth/i,
      /pixels are display only/i
    ]
  }
];

test("layout editor architecture and interaction contracts exist with required invariants", () => {
  for (const doc of requiredDocs) {
    const absolutePath = join(repoRoot, doc.path);
    assert.equal(existsSync(absolutePath), true, `${doc.path} must exist`);
    const contents = readFileSync(absolutePath, "utf8");

    for (const pattern of doc.requiredPatterns) {
      assert.match(contents, pattern, `${doc.path} must include ${pattern}`);
    }
  }
});
