import { useState } from "react";
import { useController } from "react-hook-form";

import CategoryEditor from "@/features/create-group/components/category-editor";

import { useStore } from "@/shared/configs/store";
import type { CreateGroupFormValues } from "@/features/create-group/helpers/schema";

type Chip = { name: string; icon: string };

interface PropsType {
  showHeading?: boolean;
}

const StepCategories = ({ showHeading = true }: PropsType) => {
  const masterCategories = useStore((s) => s.masterCategories);
  const { field: categoriesField, fieldState } = useController<CreateGroupFormValues, "categories">(
    {
      name: "categories",
    },
  );
  const selectedCategories = categoriesField.value;
  const [addingNewCategory, setAddingNewCategory] = useState(false);

  const selectedNames = selectedCategories.map((category) => category.name);
  const isMaster = (name: string) => masterCategories.some((master) => master.name === name);

  // Chips to render: every master category, plus any custom ones the user has added.
  const customCategories = selectedCategories.filter((category) => !isMaster(category.name));
  const visibleChips: Chip[] = [...masterCategories, ...customCategories];

  const handleToggle = (chip: Chip) => {
    if (selectedNames.includes(chip.name)) {
      categoriesField.onChange(selectedCategories.filter((c) => c.name !== chip.name));
    } else {
      categoriesField.onChange([...selectedCategories, { name: chip.name, icon: chip.icon }]);
    }
  };

  const handleAddCategory = (name: string, icon: string) => {
    categoriesField.onChange([...selectedCategories, { name, icon }]);
    setAddingNewCategory(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {showHeading && (
        <div>
          <h2 className="page-title mb-1">What will you spend on?</h2>
          <p className="text-sm text-gray-500">
            Pick the categories that make sense for this group. You can always add more later.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 overflow-y-auto max-h-48">
        {visibleChips.map((chip) => {
          const isSelected = selectedNames.includes(chip.name);
          const isCustom = !isMaster(chip.name);
          return (
            <button
              key={chip.name}
              type="button"
              onClick={() => handleToggle(chip)}
              aria-pressed={isSelected}
              className={`chip ${isSelected ? "chip-selected" : ""} ${isCustom ? "border-dashed" : ""}`}
            >
              <span>{chip.icon}</span>
              <span>{chip.name}</span>
            </button>
          );
        })}
      </div>

      {addingNewCategory ? (
        <CategoryEditor
          existingNames={visibleChips.map((chip) => chip.name)}
          onAdd={handleAddCategory}
          onCancel={() => setAddingNewCategory(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAddingNewCategory(true)}
          className="btn btn-quiet self-start"
        >
          + Add new category
        </button>
      )}

      <p className="text-xs">
        {fieldState.error ? (
          <span className="text-red-500">{fieldState.error.message}</span>
        ) : (
          <span className="text-gray-400">{selectedCategories.length} selected</span>
        )}
      </p>
    </div>
  );
};

export default StepCategories;
