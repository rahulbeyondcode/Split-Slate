import PortalComponent from "@/shared/components/portal";

import { useStore } from "@/shared/configs/store";

import { CURRENCIES } from "@/shared/constants/currencies";

const StepCurrency = () => {
  const { groups, onboardingGroupId, updateGroup, advanceOnboarding } = useStore();
  const group = groups.find((g) => g.id === onboardingGroupId);
  const currency = group?.currency ?? "INR";

  const handleSelect = (code: string) => {
    if (group) updateGroup(group.id, { currency: code });
  };

  const handleNext = () => advanceOnboarding("currency");

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
            onClick={() => handleSelect(curr.code)}
            className={`flex items-center gap-3 px-4 py-3 border rounded text-left ${
              currency === curr.code ? "border-gray-900 bg-gray-50" : "border-gray-200"
            }`}
          >
            <span className="text-lg w-8 text-center">{curr.symbol}</span>
            <span className="text-sm font-medium">{curr.code}</span>
            <span className="text-sm text-gray-500">{curr.name}</span>
          </button>
        ))}
      </div>

      <PortalComponent id="next-btn-slot">
        <button
          type="button"
          onClick={handleNext}
          className="px-6 py-2 bg-gray-900 text-white text-sm rounded"
        >
          Next
        </button>
      </PortalComponent>
    </div>
  );
};

export default StepCurrency;
