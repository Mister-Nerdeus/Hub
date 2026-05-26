export type EditorControlViewModel = {
  controlId: "floorplan-editor-controls-v1";
  controls: readonly string[];
  geometryMutationAllowed: false;
  copy: string;
};

export function createEditorControlViewModel(): EditorControlViewModel {
  return {
    controlId: "floorplan-editor-controls-v1",
    controls: ["Zoom in", "Zoom out", "Pan north", "Pan south", "Pan west", "Pan east", "Reset", "Validate export"],
    geometryMutationAllowed: false,
    copy: "Operational approximation only."
  };
}
