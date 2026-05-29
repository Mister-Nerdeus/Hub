export type SupportSpaceLabelInput = {
  roomType: string;
  label: string;
  internalReferenceId?: string | null;
};

export function supportSpaceVisibleLabel(input: SupportSpaceLabelInput): string {
  if (input.roomType === "storage") return "Storage";
  if (input.roomType === "provider_pharmacy") return "Provider / pharmacy";
  if (input.roomType === "solid_wall") return "Wall";
  return input.label;
}

export function supportSpaceInternalReference(input: SupportSpaceLabelInput): string | null {
  if (
    input.roomType !== "storage" &&
    input.roomType !== "provider_pharmacy" &&
    input.roomType !== "solid_wall"
  ) return null;
  return input.internalReferenceId ?? input.label;
}
