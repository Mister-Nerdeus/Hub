// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import {
  DEFAULT_LAYOUT_EDITOR_MODE,
  isLayoutEditorMode,
  layoutEditorModeLabel
} from "../layoutEditorMode";

declare const process: { cwd(): string };

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(DEFAULT_LAYOUT_EDITOR_MODE === "edit", "default editor mode should be edit geometry");
assert(isLayoutEditorMode("assignment"), "assignment mode should be valid");
assert(layoutEditorModeLabel("presentation") === "Presentation View", "presentation label should be explicit");

const repoRoot = resolve(process.cwd(), "../..");
const stage = readFileSync(resolve(repoRoot, "apps/web/src/features/layout-editor/LayoutEditorStage.tsx"), "utf8");
const reducer = readFileSync(resolve(repoRoot, "apps/web/src/features/layout-editor/layoutEditorReducer.ts"), "utf8");

assert(stage.includes("data-editor-mode"), "stage should expose active editor mode for visual proof");
assert(stage.includes("data-grid-state"), "stage should expose grid visibility state");
assert(!reducer.includes("setEditorMode"), "mode switching must stay out of geometry reducer");
