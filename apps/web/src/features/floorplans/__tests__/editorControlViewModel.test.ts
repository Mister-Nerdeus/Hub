import { createEditorControlViewModel } from "../editorControlViewModel";

const viewModel = createEditorControlViewModel();
for (const label of ["Zoom in", "Zoom out", "Pan north", "Pan south", "Pan west", "Pan east", "Reset", "Validate export"]) {
  if (!viewModel.controls.includes(label)) throw new Error(`missing editor control ${label}`);
}
if (viewModel.geometryMutationAllowed !== false) {
  throw new Error("editor control view model must not allow geometry mutation");
}
