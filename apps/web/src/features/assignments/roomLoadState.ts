import type { Plan1RoomLoad, PlanContract } from "@nerdeus/shared";
import { validatePlan1RoomLoads } from "@nerdeus/shared";

import roomLoadsFixture from "../../../../../packages/shared/fixtures/assignments/plan-1/room-loads-baseline.json" with { type: "json" };

export function getDefaultPlan1RoomLoads(plan: PlanContract): Plan1RoomLoad[] {
  return validatePlan1RoomLoads(roomLoadsFixture.roomLoads, plan);
}
