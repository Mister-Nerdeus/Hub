import { createEditorControlViewModel } from "../editorControlViewModel";

const before = JSON.stringify({ rooms: 1, doors: 1, hallways: 1 });
createEditorControlViewModel();
const after = JSON.stringify({ rooms: 1, doors: 1, hallways: 1 });
if (before !== after) {
  throw new Error("editor control polish must not mutate geometry");
}
