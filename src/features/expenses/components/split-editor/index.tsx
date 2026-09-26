import type { ChangeEvent } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import Input from "@/shared/components/form-elements/input";

import { calculateSplit } from "@/features/expenses/utils/calculate-split";
import { formatCurrency } from "@/shared/utils/currency";
import { moneyToDecimal, parseMoney } from "@/shared/utils/money";

import type { ExpenseFormValues, PayerMember } from "@/features/expenses/types/expenses.types";
import type { Transaction } from "@/shared/types/domain.types";

interface PropsType {
  members: PayerMember[];
  currency: string;
}

const SplitEditor = ({ members, currency }: PropsType) => {
  const { register, control, setValue, getValues } = useFormContext<ExpenseFormValues>();
  const [amount, splitType, participants] = useWatch({
    control,
    name: ["amount", "splitType", "participants"],
  });
  let preview: Transaction[] = [];
  let previewError = "";
  try {
    if (amount)
      preview = calculateSplit(
        parseMoney(amount, currency),
        splitType,
        participants.filter((row) => row.selected),
        currency,
      ).owes;
  } catch (error) {
    previewError = (error as Error).message;
  }

  const changeSplit = (value: string) => {
    setValue(
      "participants",
      getValues("participants").map((row) => ({ ...row, value: value === "shares" ? "1" : "" })),
    );
  };
  const handleSplitChange = (event: ChangeEvent<HTMLSelectElement>) =>
    changeSplit(event.target.value);
  const inputLabel =
    splitType === "shares"
      ? "Shares"
      : splitType === "percentage"
        ? "Percentage"
        : splitType === "adjustment"
          ? "Adjustment"
          : "Amount owed";

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="field-label">Split between</legend>
      <div className="segmented flex flex-wrap !rounded-2xl" role="group" aria-label="Split method">
        {(
          [
            ["equal", "Equal"],
            ["amount", "Amount"],
            ["shares", "Shares"],
            ["percentage", "%"],
            ["adjustment", "Adjust"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={splitType === value}
            onClick={() => {
              setValue("splitType", value, { shouldValidate: true });
              changeSplit(value);
            }}
            className={splitType === value ? "active" : ""}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="sr-only">
        Split method
        <select {...register("splitType", { onChange: handleSplitChange })} className="form-input">
          <option value="equal">Equally</option>
          <option value="amount">Exact amounts</option>
          <option value="shares">Shares</option>
          <option value="percentage">Percentages</option>
          <option value="adjustment">Adjustments</option>
        </select>
      </label>
      {splitType === "amount" && (
        <p className="text-xs text-gray-500">
          Leave amounts blank to split the remainder equally. The suggested amounts will be saved.
        </p>
      )}
      {splitType === "adjustment" && (
        <p className="text-xs text-gray-500">
          Add or subtract from each person's equal base share. Blank means no adjustment.
        </p>
      )}
      {(splitType === "shares" || splitType === "percentage") && (
        <p className="text-xs text-gray-500">Use positive values with up to 6 decimal places.</p>
      )}
      {members.map((member, index) => {
        const share = preview.find((row) => row.memberId === member.id);
        return (
          <div key={member.id} className="ui-row">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                {...register(`participants.${index}.selected`)}
                className="accent-[var(--brand)]"
              />
              {member.name}
            </label>
            {participants[index]?.selected && (
              <div className="flex flex-wrap items-center gap-2">
                {splitType !== "equal" && (
                  <Input
                    name={`participants.${index}.value`}
                    aria-label={`${inputLabel} for ${member.name}`}
                    inputMode="decimal"
                    wrapperClass="w-32"
                    placeholder={
                      splitType === "amount" && share
                        ? moneyToDecimal(share.amount, currency)
                        : splitType === "adjustment"
                          ? "0"
                          : inputLabel
                    }
                  />
                )}
                {share && (
                  <span
                    className="money text-sm font-semibold"
                    aria-label={`${member.name} owes ${formatCurrency(share.amount, currency)}`}
                  >
                    {formatCurrency(share.amount, currency)}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
      {previewError && (
        <p role="status" className="text-sm text-amber-800">
          {previewError}
        </p>
      )}
    </fieldset>
  );
};

export default SplitEditor;
