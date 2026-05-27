import type { AddObjectMenuItemId, AddObjectMenuViewModel } from "./addObjectMenuViewModel";

export type AddObjectMenuProps = {
  viewModel: AddObjectMenuViewModel;
  readOnly: boolean;
  onSelect: (itemId: AddObjectMenuItemId) => void;
};

export function AddObjectMenu({ viewModel, readOnly, onSelect }: AddObjectMenuProps) {
  return (
    <section className="add-object-menu" aria-label="Add Object menu" data-add-object-menu="open">
      {viewModel.items.map((item) => (
        <button
          key={item.id}
          type="button"
          disabled={readOnly}
          data-add-object-item={item.id}
          onClick={() => onSelect(item.id)}
        >
          {item.label}
        </button>
      ))}
    </section>
  );
}
