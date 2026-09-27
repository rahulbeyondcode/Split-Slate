import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import { useController } from "react-hook-form";

import type { CreateGroupFormValues } from "@/features/create-group/helpers/schema";

import { CURRENCIES } from "@/shared/constants/currencies";

const FREQUENT_CURRENCY_CODES = ["INR", "USD", "AED", "GBP", "SGD"];
const FREQUENT_CURRENCIES = CURRENCIES.filter((currency) =>
  FREQUENT_CURRENCY_CODES.includes(currency.code),
).sort((a, b) => FREQUENT_CURRENCY_CODES.indexOf(a.code) - FREQUENT_CURRENCY_CODES.indexOf(b.code));

interface PropsType {
  showHeading?: boolean;
}

const StepCurrency = ({ showHeading = true }: PropsType) => {
  const [search, setSearch] = useState("");
  const currencyListRef = useRef<HTMLDivElement>(null);
  const { field } = useController<CreateGroupFormValues, "currency">({ name: "currency" });
  const query = search.trim().toLocaleLowerCase();
  const isSearching = search.length > 0;
  const visibleCurrencies = CURRENCIES.filter((currency) =>
    [currency.code, currency.name, currency.symbol].some((value) =>
      value.toLocaleLowerCase().includes(query),
    ),
  );
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    currencyListRef.current?.scrollTo({ top: 0 });
  };
  const handleClearSearch = () => {
    setSearch("");
    currencyListRef.current?.scrollTo({ top: 0 });
  };

  return (
    <div className="currency-step flex flex-col gap-6">
      {showHeading && (
        <div>
          <h2 className="page-title mb-1">One currency for this group</h2>
          <p className="text-sm text-gray-500">
            All expenses in this group will use this currency.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="field-label" htmlFor="currency-search">
          Search currencies
        </label>
        <div className="relative">
          <input
            id="currency-search"
            type="text"
            role="searchbox"
            inputMode="search"
            className="form-input pr-18"
            placeholder="Search by name, code or symbol"
            value={search}
            onChange={handleSearchChange}
          />
          {isSearching && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear currency search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-[var(--brand-ink)] hover:bg-[var(--brand-soft)]"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {!isSearching && (
        <section className="flex flex-col gap-3" aria-label="Quick picks">
          <h3 className="text-xs font-bold text-[var(--muted)]">Quick picks</h3>
          <div className="flex flex-wrap gap-2">
            {FREQUENT_CURRENCIES.map((curr) => (
              <button
                key={curr.code}
                type="button"
                onClick={() => field.onChange(curr.code)}
                aria-pressed={field.value === curr.code}
                title={curr.name}
                className={`chip ${field.value === curr.code ? "chip-selected" : ""}`}
              >
                <span>{curr.symbol}</span>
                <span>{curr.code}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="currency-list-section flex flex-col gap-3" aria-label="All currencies">
        <h3 className="text-xs font-bold text-[var(--muted)]">All currencies</h3>
        <div
          ref={currencyListRef}
          className="currency-list flex flex-col gap-2 overflow-y-auto max-h-96"
        >
          {visibleCurrencies.length === 0 && (
            <p className="soft-caption py-4">No currencies match your search.</p>
          )}
          {visibleCurrencies.map((curr) => (
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
      </section>
    </div>
  );
};

export default StepCurrency;
