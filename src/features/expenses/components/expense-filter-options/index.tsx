import { useFormContext } from "react-hook-form";

import type {
  ExpenseFilterOptionField,
  ExpenseFilterValues,
} from "@/features/expenses/types/expense-filters.types";

interface PropsType {
  name: ExpenseFilterOptionField;
  label: string;
  options: readonly { value: string; label: string }[];
}

const ExpenseFilterOptions = ({ name, label, options }: PropsType) => {
  const { register } = useFormContext<ExpenseFilterValues>();
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm"
          >
            <input type="checkbox" value={option.value} {...register(name)} />
            {option.label}
          </label>
        ))}
        {!options.length && <p className="text-sm text-gray-500">None available.</p>}
      </div>
    </fieldset>
  );
};

export default ExpenseFilterOptions;
