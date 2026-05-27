export type AddObjectMenuItemId =
  | "room"
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
};

export type AddObjectMenuViewModel = {
  items: readonly AddObjectMenuItem[];
};

export function buildAddObjectMenuViewModel(): AddObjectMenuViewModel {
  return {
    items: [
      { id: "room", label: "Room", placementModeLabel: "Place room" },
      { id: "door", label: "Door", placementModeLabel: "Place door" },
      { id: "nurse_station", label: "Nurse Station / Nurse Desk", placementModeLabel: "Place station" },
      { id: "hallway", label: "Hallway", placementModeLabel: "Place hallway" },
      { id: "zone", label: "Zone", placementModeLabel: "Place zone" },
      { id: "label", label: "Label", placementModeLabel: "Place label" },
      { id: "provider_pharmacy", label: "Provider/Pharmacy Area", placementModeLabel: "Place provider/pharmacy area" },
      { id: "ems_entry", label: "EMS Entry marker", placementModeLabel: "Place EMS entry marker" }
    ]
  };
}
