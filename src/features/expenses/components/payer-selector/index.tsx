import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import Input from "@/shared/components/form-elements/input";

import type { ExpenseFormValues, PayerMember } from "@/features/expenses/types/expenses.types";

interface PropsType {
  members: PayerMember[];
  quickIds: string[];
  currency: string;
}

const PayerSelector = ({ members, quickIds, currency }: PropsType) => {
  const { register, control } = useFormContext<ExpenseFormValues>();
  const mode = useWatch({ control, name: "payerMode" });
  const selected = useWatch({ control, name: "payerId" });
  const [showAll, setShowAll] = useState(false);
  const visibleIds = showAll
    ? members.map((member) => member.id)
    : [...new Set([...quickIds, selected])];

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 font-semibold">Paid by</legend>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" value="single" {...register("payerMode")} />
          One person
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" value="multiple" {...register("payerMode")} />
          Multiple payers
        </label>
      </div>
      {mode === "single" ? (
        <>
          <div className="flex flex-wrap gap-2">
            {visibleIds.map((id) => {
              const member = members.find((item) => item.id === id);
              return member ? (
                <label
                  key={id}
                  className="flex items-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm"
                >
                  <input
                    type="radio"
                    value={id}
                    aria-label={`Paid by ${member.name}`}
                    {...register("payerId")}
                  />
                  {member.name}
                </label>
              ) : null;
            })}
          </div>
          {!showAll && members.some((member) => !visibleIds.includes(member.id)) && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="self-start text-sm text-blue-700"
            >
              Show more payers
            </button>
          )}
        </>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {members.map((member, index) => (
            <label key={member.id} className="flex flex-col gap-1 text-sm">
              {member.name} paid ({currency})
              <Input
                name={`payers.${index}.amount`}
                aria-label={`${member.name} paid (${currency})`}
                inputMode="decimal"
                placeholder="0"
              />
            </label>
          ))}
          <p className="text-xs text-gray-500 sm:col-span-2">
            Contributions must add up to the total. Leave non-payers blank.
          </p>
        </div>
      )}
    </fieldset>
  );
};

export default PayerSelector;
