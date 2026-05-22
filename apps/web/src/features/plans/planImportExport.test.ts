import { planErPodPhase2 } from "../../fixtures/planErPodPhase2";
import { parsePlanImport, serializePlanForExport } from "./planImportExport";

const exported = serializePlanForExport(planErPodPhase2);
const imported = parsePlanImport(exported);

if (imported.planId !== planErPodPhase2.planId) {
  throw new Error("Exported JSON must import back into the same plan");
}

try {
  parsePlanImport("{not-json");
  throw new Error("Invalid JSON must be rejected");
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes("Invalid JSON")) {
    throw error;
  }
}

try {
  parsePlanImport(JSON.stringify({ ...planErPodPhase2, unknown: true }));
  throw new Error("Unknown fields must be rejected on import");
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes("not allowed")) {
    throw error;
  }
}
