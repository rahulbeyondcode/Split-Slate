import { useController } from "react-hook-form";

import type { SetupFormValues } from "@/features/onboarding/helpers/setup-schema";

import { CURRENCIES } from "@/shared/constants/currencies";

const StepCurrency = () => {
  const { field } = useController<SetupFormValues, "currency">({ name: "currency" });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Choose a currency</h2>
        <p className="text-sm text-gray-500">All expenses in this group will use this currency.</p>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto max-h-72">
        {CURRENCIES.map((curr) => (
          <button
            key={curr.code}
            type="button"
            onClick={() => field.onChange(curr.code)}
            className={`flex items-center gap-3 px-4 py-3 border rounded text-left ${
              field.value === curr.code ? "border-gray-900 bg-gray-50" : "border-gray-200"
            }`}
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
