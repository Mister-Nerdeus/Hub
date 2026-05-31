import type { AppSection, AppSectionId } from "./appNavigation";
import { ProductSidebarRail } from "./ProductSidebarRail";

type ProductSidebarProps = {
  activeSection: AppSectionId;
  sections: readonly AppSection[];
  onSectionChange: (sectionId: AppSectionId) => void;
};

export function ProductSidebar(props: ProductSidebarProps) {
  // Compatibility wrapper: ProductSidebarRail owns the app-nav__button rail classes.
  return <ProductSidebarRail {...props} />;
}
