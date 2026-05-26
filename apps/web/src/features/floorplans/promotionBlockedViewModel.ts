export type PromotionBlockedViewModel = {
  bannerId: "plan-builder-promotion-blocked-v1";
  title: string;
  messages: string[];
  promotionEnabled: false;
};

export function createPromotionBlockedViewModel(): PromotionBlockedViewModel {
  return {
    bannerId: "plan-builder-promotion-blocked-v1",
    title: "Promotion Blocked",
    messages: [
      "Promotion is blocked until an explicit structured human visual review record exists.",
      "Route/export readiness is not manual review.",
      "Default fixtures are unchanged.",
      "Promotion-review requires a separate future batch."
    ],
    promotionEnabled: false
  };
}
