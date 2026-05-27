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

  return (
    <aside className="layout-inspector-tabs" aria-label="Tabbed layout inspector">
      <div className="layout-inspector-tabs__list" role="tablist" aria-label="Inspector tabs">
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
      <div className="layout-inspector-tabs__panel" role="tabpanel" aria-label={`${activeTab} inspector tab`}>
        {panelByTab[activeTab]}
      </div>
    </aside>
  );
}
