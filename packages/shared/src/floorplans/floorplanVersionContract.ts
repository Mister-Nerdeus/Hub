import type { AuthoringDraftContract } from "./authoringDraftContract.js";

export type FloorplanVersionContract = {
  schemaVersion: "1.0.0";
  versionId: string;
  floorplanId: string;
  displayName: string;
  versionLabel: string;
  status:
    | "draft"
    | "saved"
    | "ready_for_assignment"
    | "archived";
  savedAt: string;
  parentVersionId: string | null;
  authoringDraft: AuthoringDraftContract;
};
