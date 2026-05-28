export type SplitBayCandidate = {
  splitBayId: string;
  bedPositionRoomIds: readonly [string, string];
  physicalBayCount: 1;
  bedPositionCount: 2;
  dividerSemantics: "shared-divider";
  finalVisualReviewRequired: true;
};

export const CANONICAL_SPLIT_BAY_CANDIDATES: readonly SplitBayCandidate[] = [
  {
    splitBayId: "split-bay-02-03",
    bedPositionRoomIds: ["room-02", "room-03"],
    physicalBayCount: 1,
    bedPositionCount: 2,
    dividerSemantics: "shared-divider",
    finalVisualReviewRequired: true
  },
  {
    splitBayId: "split-bay-04-05",
    bedPositionRoomIds: ["room-04", "room-05"],
    physicalBayCount: 1,
    bedPositionCount: 2,
    dividerSemantics: "shared-divider",
    finalVisualReviewRequired: true
  },
  {
    splitBayId: "split-bay-06-07",
    bedPositionRoomIds: ["room-06", "room-07"],
    physicalBayCount: 1,
    bedPositionCount: 2,
    dividerSemantics: "shared-divider",
    finalVisualReviewRequired: true
  },
  {
    splitBayId: "split-bay-08-09",
    bedPositionRoomIds: ["room-08", "room-09"],
    physicalBayCount: 1,
    bedPositionCount: 2,
    dividerSemantics: "shared-divider",
    finalVisualReviewRequired: true
  }
];

export function splitBayForRoomId(roomId: string): SplitBayCandidate | null {
  return CANONICAL_SPLIT_BAY_CANDIDATES.find((candidate) => candidate.bedPositionRoomIds.includes(roomId)) ?? null;
}
