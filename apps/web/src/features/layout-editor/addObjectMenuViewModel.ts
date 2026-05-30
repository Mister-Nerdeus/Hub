export type AddObjectMenuItemId =
  | "patient_care_room"
  | "storage_room"
  | "solid_wall"
  | "split_bay"
  | "door"
  | "nurse_station"
  | "hallway"
  | "zone"
  | "label"
  | "provider_pharmacy"
  | "ems_entry";

export type AddObjectMenuItem = {
  id: AddObjectMenuItemId;
  label: string;
  placementModeLabel: string;
  disabled?: boolean;
  disabledReason?: string;
};

export type AddObjectMenuViewModel = {
  items: readonly AddObjectMenuItem[];
};

export function buildAddObjectMenuViewModel(): AddObjectMenuViewModel {
  return {
    items: [
      { id: "patient_care_room", label: "Patient Care Room", placementModeLabel: "Place patient care room" },
      { id: "storage_room", label: "Storage Room", placementModeLabel: "Place storage room" },
      { id: "solid_wall", label: "Solid Wall / Blocked Area", placementModeLabel: "Place solid wall / blocked area" },
      { id: "door", label: "Door", placementModeLabel: "Place door" },
      { id: "nurse_station", label: "Nurse Station / Nurse Desk", placementModeLabel: "Place station" },
      { id: "hallway", label: "Hallway", placementModeLabel: "Place hallway" },
      { id: "zone", label: "Zone", placementModeLabel: "Place zone" },
      { id: "label", label: "Label", placementModeLabel: "Place label" },
      { id: "provider_pharmacy", label: "Provider/Pharmacy Area", placementModeLabel: "Place provider/pharmacy area" },
      { id: "ems_entry", label: "EMS Entry marker", placementModeLabel: "Place EMS entry marker" },
      { id: "split_bay", label: "Split Bay", placementModeLabel: "Place split bay" }
    ]
  };
}

export function isRoomPlacementMenuItem(itemId: AddObjectMenuItemId): boolean {
  return itemId === "patient_care_room" || itemId === "storage_room" || itemId === "provider_pharmacy" || itemId === "solid_wall";
}

export function roomTypeForPlacementMenuItem(itemId: AddObjectMenuItemId): "patient_room" | "storage" | "provider_pharmacy" | "solid_wall" | null {
  if (itemId === "patient_care_room") return "patient_room";
  if (itemId === "storage_room") return "storage";
  if (itemId === "provider_pharmacy") return "provider_pharmacy";
  if (itemId === "solid_wall") return "solid_wall";
  return null;
}
