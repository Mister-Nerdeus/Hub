import { SavePlanControls } from "./SavePlanControls";

let saved = false;
let savedAs: string | null = null;
const element = SavePlanControls({
  draft: null,
  canSave: true,
  canSaveAs: true,
  onSave: () => {
    saved = true;
  },
  onSaveAs: (displayName, versionLabel) => {
    savedAs = `${displayName}:${versionLabel}`;
  }
});

if (element.type !== "section") {
  throw new Error("SavePlanControls must render a section");
}
if (saved || savedAs != null) {
  throw new Error("SavePlanControls must not invoke callbacks during render");
}
