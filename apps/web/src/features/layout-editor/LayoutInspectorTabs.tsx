import { useEffect, useState, type ReactNode } from "react";
import {
  defaultInspectorTabForSelection,
  LAYOUT_INSPECTOR_TABS,
  type LayoutInspectorTabId
} from "./layoutInspectorTabsViewModel";
import type { LayoutEditorSelectableObjectType } from "./layoutEditorState";

type LayoutInspectorTabsProps = {
  selectedObjectType: LayoutEditorSelectableObjectType | null;
  room: ReactNode;
  door: ReactNode;
  assignment: ReactNode;
  validation: ReactNode;
};

export function LayoutInspectorTabs({
  selectedObjectType,
  room,
  door,
  assignment,
  validation
}: LayoutInspectorTabsProps) {
  const [activeTab, setActiveTab] = useState<LayoutInspectorTabId>(() =>
    defaultInspectorTabForSelection(selectedObjectType)
  );
  useEffect(() => {
    setActiveTab(defaultInspectorTabForSelection(selectedObjectType));
  }, [selectedObjectType]);

  const panelByTab: Record<LayoutInspectorTabId, ReactNode> = {
    room,
    door,
    assignment,
    validation
  };
  const activeTabDefinition = LAYOUT_INSPECTOR_TABS.find((tab) => tab.id === activeTab);
  const activeTabLabel = activeTabDefinition?.label ?? "Selected object";

  return (
    <aside
      className="layout-inspector-tabs"
      aria-label="Tabbed layout inspector"
      data-selected-object-details="true"
      data-selected-object-first="true"
    >
      <div className="layout-inspector-tabs__panel layout-inspector-tabs__panel--primary" role="tabpanel" aria-label={`${activeTabLabel} details`}>
        {panelByTab[activeTab]}
      </div>
      <details className="layout-inspector-tabs__more" data-secondary-tabs-collapsed="true">
        <summary>More details</summary>
        <div className="layout-inspector-tabs__list" role="tablist" aria-label="Secondary inspector tabs">
          {LAYOUT_INSPECTOR_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={activeTab === tab.id ? "layout-inspector-tabs__tab--active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </details>
    </aside>
  );
}
