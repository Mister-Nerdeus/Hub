import type { LayoutEditorFloorplanInput } from "../layout-editor/layoutEditorState";
import { LayoutEditorStage } from "../layout-editor/LayoutEditorStage";

type FloorplanEditorProps = {
  activeFloorplan?: LayoutEditorFloorplanInput | null;
};

export function FloorplanEditor({ activeFloorplan = null }: FloorplanEditorProps) {
  return <LayoutEditorStage activeFloorplan={activeFloorplan} />;
}
