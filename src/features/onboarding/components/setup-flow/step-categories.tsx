import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import Input from "@/shared/components/form-elements/input";
import PortalComponent from "@/shared/components/portal";

import { useStore } from "@/shared/configs/store";

import type { CategoryFormValues } from "@/features/onboarding/components/setup-flow/types";
import { MASTER_CATEGORIES } from "@/shared/constants/categories";

const createCategorySchema = (existing: string[]) =>
  z.object({
    category: z
      .string()
      .min(1)
      .refine(
        (val) => !existing.some((c) => c.toLowerCase() === val.trim().toLowerCase()),
        "Category already exists",
      ),
  });

const StepCategories = () => {
  const { groups, categories, onboardingGroupId, addCategory, removeCategory, advanceOnboarding } =
    useStore();
  const group = groups.find((g) => g.id === onboardingGroupId);
  const groupCategories = categories.filter((c) => c.groupId === onboardingGroupId);

  const selectedNames = groupCategories.map((c) => c.name);
  const customNames = selectedNames.filter((name) => !MASTER_CATEGORIES.includes(name));
  const allCategories = [...MASTER_CATEGORIES, ...customNames];

  const methods = useForm<CategoryFormValues>({
    resolver: zodResolver(createCategorySchema(allCategories)),
    defaultValues: { category: "" },
  });

  const { handleSubmit, reset } = methods;

  const handleAddCustom = handleSubmit(({ category }) => {
    if (group) addCategory(group.id, category.trim());
    reset();
  });

  const handleToggle = (name: string) => {
    if (!group) return;
    const existing = groupCategories.find((c) => c.name === name);
    if (existing) removeCategory(existing.id);
    else addCategory(group.id, name);
  };

  const handleNext = () => advanceOnboarding("categories");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Choose categories</h2>
        <p className="text-sm text-gray-500">
          Pick the categories that make sense for this group. You can always add more later.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 overflow-y-auto max-h-48">
        {allCategories.map((cat) => {
          const isSelected = selectedNames.includes(cat);
          const isCustom = customNames.includes(cat);
          return (
            <button
              key={cat}
              type="button"
              onClick={() => handleToggle(cat)}
              className={`px-3 py-1.5 text-sm rounded border ${
                isSelected
                  ? "bg-gray-900 text-white border-gray-900"
                  : "border-gray-300 text-gray-700"
              } ${isCustom ? "border-dashed" : ""}`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <FormProvider {...methods}>
        <form onSubmit={handleAddCustom} className="flex gap-2 items-start">
          <Input name="category" placeholder="Add a custom category…" wrapperClass="flex-1" />
          <button type="submit" className="px-4 py-2 bg-gray-900 text-white text-sm rounded">
            Add
          </button>
        </form>
      </FormProvider>

      <p className="text-xs text-gray-400">
        {selectedNames.length === 0
          ? "None selected — you can add categories anytime from group settings."
          : `${selectedNames.length} selected`}
      </p>

      <PortalComponent id="next-btn-slot">
        <button
          type="button"
          onClick={handleNext}
          disabled={selectedNames.length === 0}
          className="px-6 py-2 bg-gray-900 text-white text-sm rounded disabled:opacity-30"
        >
          Next
        </button>
      </PortalComponent>
    </div>
  );
};

export default StepCategories;
