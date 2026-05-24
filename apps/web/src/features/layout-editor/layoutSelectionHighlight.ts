import type { LayoutSelectionObjectType } from "./layoutSelectionModel";

export type LayoutSelectionHighlightInput = {
  objectType: LayoutSelectionObjectType;
  objectId: string;
  selectedObjectType: LayoutSelectionObjectType | null;
  selectedObjectId: string | null;
};

export function isLayoutObjectSelected({
  objectType,
  objectId,
  selectedObjectType,
  selectedObjectId
}: LayoutSelectionHighlightInput): boolean {
  return selectedObjectType === objectType && selectedObjectId === objectId;
}

export function selectedClassName(baseClassName: string, isSelected: boolean): string {
  return isSelected ? `${baseClassName} ${baseClassName}--selected` : baseClassName;
}
