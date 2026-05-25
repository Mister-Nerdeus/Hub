// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const source = readFileSync(resolve(repoRoot, "apps/web/src/features/scenarios/Plan1SimulationTimelinePanel.tsx"), "utf8");

assertTimeline(source.includes("data-timeline-callouts=\"plan-1\""), "timeline panel must render Plan 1 callouts");
assertTimeline(source.includes("highestQueueCallout"), "timeline panel must render highest queue callout");
assertTimeline(source.includes("deferredTasksCallout"), "timeline panel must render deferred task callout");
assertTimeline(source.includes("walkingLoadCallout"), "timeline panel must render walking load callout");
assertTimeline(source.includes("data-timeline-non-claims=\"visible\""), "timeline panel must expose non-claims");
assertTimeline(source.includes("operationalOnlyLabel"), "timeline panel must render operational-only label");

function assertTimeline(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}
