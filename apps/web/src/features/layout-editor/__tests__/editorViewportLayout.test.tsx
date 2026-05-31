// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { readFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";
import { buildEditorViewportLayoutViewModel } from "../editorViewportLayoutViewModel";

declare const process: { cwd(): string };

const expanded = buildEditorViewportLayoutViewModel({
  inspectorCollapsed: false,
  validationWarningCount: 3
});
if (expanded.canvasLayoutStatus !== "dominant") {
  throw new Error("expanded editor layout should still keep the canvas dominant");
}
if (expanded.inspectorState !== "expanded") {
  throw new Error("expanded editor layout should expose expanded inspector state");
}
if (expanded.validationSummary !== "3 validation warnings") {
  throw new Error("validation summary should include warning count");
}

const collapsed = buildEditorViewportLayoutViewModel({
  inspectorCollapsed: true,
  validationWarningCount: 0
});
if (!collapsed.workspaceClassName.includes("layout-editor-stage__workspace--inspector-collapsed")) {
  throw new Error("collapsed editor layout should use the collapsed workspace class");
}
if (collapsed.dataAttributes["data-command-bar"] !== "compact") {
  throw new Error("editor layout should expose compact command bar DOM assertion data");
}
if (collapsed.validationSummary !== "No validation warnings") {
  throw new Error("zero-warning validation summary should be compact");
}

const repoRoot = resolve(process.cwd(), "../..");
const stageSource = readFileSync(resolve(repoRoot, "apps/web/src/features/layout-editor/LayoutEditorStage.tsx"), "utf8");
const cssSource = readFileSync(resolve(repoRoot, "apps/web/src/features/layout-editor/LayoutEditorStage.css"), "utf8");
const viewModelSource = readFileSync(resolve(repoRoot, "apps/web/src/features/layout-editor/editorViewportLayoutViewModel.ts"), "utf8");

for (const snippet of [
  "EditorCommandBar",
  "inspectorCollapsed",
  "layout-editor-stage__json-drawer",
  "data-canvas-layout",
  "layout-editor-stage__workspace--inspector-collapsed",
  "EditorDetailsPanel"
]) {
  if (!stageSource.includes(snippet) && !cssSource.includes(snippet) && !viewModelSource.includes(snippet)) {
    throw new Error(`editor viewport layout missing ${snippet}`);
  }
}

if (!cssSource.includes("max-width: none")) {
  throw new Error("editor shell should use the full workspace width");
}
if (!cssSource.includes("grid-template-columns: minmax(0, 1fr)")) {
  throw new Error("editor workspace should reserve normal width for the canvas");
}
if (!stageSource.includes("data-editor-canvas-primary=\"true\"")) {
  throw new Error("editor workspace should mark the canvas as the primary work area");
}
