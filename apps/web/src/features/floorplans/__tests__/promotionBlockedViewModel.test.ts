// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { mkdirSync, writeFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import { createPromotionBlockedViewModel } from "../promotionBlockedViewModel";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const evidenceDir = resolve(repoRoot, "docs/verification/issues/issue-338");

function writeEvidence(name: string, payload: unknown) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(resolve(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

const banner = createPromotionBlockedViewModel();
const text = JSON.stringify(banner);
if (banner.promotionEnabled) {
  throw new Error("promotion blocked banner must keep promotion disabled");
}
if (/manual visual approval(?: exists| complete| passed)?/iu.test(text)) {
  throw new Error("banner must avoid forbidden manual visual approval phrasing");
}
if (!/Route\/export readiness is not manual review/u.test(text)) {
  throw new Error("banner must distinguish route/export readiness from manual review");
}

writeEvidence("promotion-blocked-banner-output.json", {
  issue: "338",
  status: "passed",
  banner
});
writeEvidence("forbidden-phrase-negative-output.json", {
  issue: "338",
  status: "passed",
  forbiddenPhrasePresent: false
});
