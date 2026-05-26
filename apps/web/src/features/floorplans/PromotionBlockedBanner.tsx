import type { PromotionBlockedViewModel } from "./promotionBlockedViewModel";

type PromotionBlockedBannerProps = {
  viewModel: PromotionBlockedViewModel;
};

export function PromotionBlockedBanner({ viewModel }: PromotionBlockedBannerProps) {
  return (
    <aside className="promotion-blocked-banner" aria-labelledby="promotion-blocked-title">
      <div>
        <h3 id="promotion-blocked-title">{viewModel.title}</h3>
        <ul>
          {viewModel.messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      </div>
      <button type="button" disabled={!viewModel.promotionEnabled}>
        Promote
      </button>
    </aside>
  );
}
