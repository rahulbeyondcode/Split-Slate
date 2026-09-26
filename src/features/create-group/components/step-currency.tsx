import { useController } from "react-hook-form";

import type { CreateGroupFormValues } from "@/features/create-group/helpers/schema";

import { CURRENCIES } from "@/shared/constants/currencies";

const StepCurrency = () => {
  const { field } = useController<CreateGroupFormValues, "currency">({ name: "currency" });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="page-title mb-1">One currency for this group</h2>
        <p className="text-sm text-gray-500">All expenses in this group will use this currency.</p>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto max-h-96">
        {CURRENCIES.map((curr) => (
          <button
            key={curr.code}
            type="button"
            onClick={() => field.onChange(curr.code)}
            aria-pressed={field.value === curr.code}
            className={`surface flex items-center gap-3 px-4 py-3 text-left ${field.value === curr.code ? "!bg-[var(--brand-soft)] !border-[var(--brand)]" : ""}`}
          >
            <span className="text-lg w-8 text-center">{curr.symbol}</span>
            <span className="text-sm font-medium">{curr.code}</span>
            <span className="text-sm text-gray-500">{curr.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StepCurrency;
