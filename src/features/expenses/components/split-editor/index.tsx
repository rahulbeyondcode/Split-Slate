import type { ChangeEvent, ReactNode } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import Input from "@/shared/components/form-elements/input";

import {
  calculateSplit,
  percentageText,
  resolvePercentageParticipants,
} from "@/features/expenses/utils/calculate-split";
import { formatPercentageDisplay } from "@/features/expenses/utils/percentage-display";
import {
  capPercentageInput,
  previewIncompleteSplit,
  sanitizeSplitInput,
} from "@/features/expenses/utils/split-input";
import { formatCurrency } from "@/shared/utils/currency";
import { parseMoney } from "@/shared/utils/money";

import type { ExpenseFormValues, PayerMember } from "@/features/expenses/types/expenses.types";
import type { Transaction } from "@/shared/types/domain.types";

import Avatar from "@/shared/ui/avatar";

interface PropsType {
  members: PayerMember[];
  currency: string;
  validationMessage?: string;
}

const SplitEditor = ({ members, currency, validationMessage }: PropsType) => {
  const { register, control, setValue, getValues } = useFormContext<ExpenseFormValues>();
  const [amount, splitType, participants] = useWatch({
    control,
    name: ["amount", "splitType", "participants"],
  });
  let preview: Transaction[] = [];
  let previewError = "";
  let total = 0;
  let percentageSuggestions: { memberId: string; value: string }[] = [];
  if (splitType === "percentage") {
    try {
      percentageSuggestions = resolvePercentageParticipants(
        participants.filter((row) => row.selected),
      );
    } catch {
      // Invalid in-progress values are reported by the preview calculator.
    }
  }
  try {
    if (amount) {
      total = parseMoney(amount, currency);
      const selected = participants.filter((row) => row.selected);
      try {
        preview = calculateSplit(total, splitType, selected, currency).owes;
      } catch (error) {
        previewError = (error as Error).message;
        preview = previewIncompleteSplit(total, splitType, selected, currency);
      }
    }
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
  const allSelected = participants.every((row) => row.selected);
  const handleToggleAll = () => {
    setValue(
      "participants",
      getValues("participants").map((row) => ({ ...row, selected: !allSelected })),
      { shouldDirty: true, shouldValidate: true },
    );
  };
  const inputLabel =
    splitType === "shares"
      ? "Shares"
      : splitType === "percentage"
        ? "Percentage"
        : splitType === "adjustment"
          ? "Adjustment"
          : "Amount owed";
  const sectionTitle =
    splitType === "equal"
      ? `Equal share for each person (${currency})`
      : splitType === "amount"
        ? `Amount each person owes (${currency})`
        : splitType === "shares"
          ? "Shares for each person"
          : splitType === "percentage"
            ? "Percentage for each person"
            : `Adjustment per person (${currency})`;
  const selected = participants.filter((row) => row.selected);
  const blankCount = selected.filter((row) => !row.value.trim()).length;
  const splitError =
    previewError ||
    (!preview.length && !/payer|who paid/iu.test(validationMessage ?? "") ? validationMessage : "");
  let summary: ReactNode = null;
  if (
    total > 0 &&
    !splitError &&
    preview.length &&
    selected.some((row) => row.value.trim() !== "")
  ) {
    if (splitType === "amount") {
      const entered = selected.reduce(
        (sum, row) => sum + (row.value.trim() ? parseMoney(row.value, currency) : 0),
        0,
      );
      summary = blankCount ? (
        <>
          ✓ <strong>{formatCurrency(entered, currency)}</strong> entered · remaining{" "}
          <strong>{formatCurrency(total - entered, currency)}</strong> auto-splits across{" "}
          <strong>{blankCount}</strong> blank field{blankCount === 1 ? "" : "s"}
        </>
      ) : (
        <>
          ✓ <strong>{formatCurrency(entered, currency)}</strong> entered · fully allocated
        </>
      );
    } else if (splitType === "percentage") {
      const entered = selected.reduce((sum, row) => {
        if (!row.value.trim()) return sum;
        const [whole, fraction = ""] = row.value.trim().split(".");
        return sum + BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, "0"));
      }, 0n);
      summary = blankCount ? (
        <>
          ✓ <strong>{formatPercentageDisplay(percentageText(entered))}%</strong> entered · remaining{" "}
          <strong>{formatPercentageDisplay(percentageText(100_000_000n - entered))}%</strong>{" "}
          auto-splits across <strong>{blankCount}</strong> blank field{blankCount === 1 ? "" : "s"}
        </>
      ) : (
        <>
          ✓ <strong>100%</strong> assigned · <strong>{formatCurrency(total, currency)}</strong>{" "}
          allocated
        </>
      );
    }
  }
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="field-label">Split between</legend>
      <div
        className="segmented expense-split-methods !rounded-2xl"
        role="group"
        aria-label="Split method"
      >
        {(
          [
            ["equal", "Equal"],
            ["amount", "Unequal"],
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
      <label className="chip choice-pill expense-select-all self-start">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={handleToggleAll}
          className="choice-control"
        />
        <span>Select all</span>
      </label>
      <h3 className="text-base font-extrabold leading-snug text-[var(--ink)]">{sectionTitle}</h3>
      {summary && (
        <p className="expense-split-summary money-positive text-sm font-normal" aria-live="polite">
          {summary}
        </p>
      )}
      {splitType === "adjustment" && (
        <p className="text-xs text-gray-500">
          Add or subtract from each person's equal base share. Blank means no adjustment.
        </p>
      )}
      {members.map((member, index) => {
        const share = preview.find((row) => row.memberId === member.id);
        const owed = participants[index]?.selected ? (share?.amount ?? 0) : 0;
        const suggestedPercentage = percentageSuggestions.find(
          (row) => row.memberId === member.id,
        )?.value;
        return (
          <div key={member.id} className="ui-row expense-split-row">
            <label className="expense-split-member flex min-w-0 cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                {...register(`participants.${index}.selected`)}
                className="choice-control"
              />
              <Avatar icon={member.icon} name={member.name} />
              <span className="min-w-0 break-words">{member.name}</span>
            </label>
            <div className="expense-split-values ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
              <span
                className="money text-sm font-semibold"
                aria-label={`${member.name} owes ${formatCurrency(owed, currency)}`}
              >
                {formatCurrency(owed, currency)}
              </span>
              {participants[index]?.selected && splitType !== "equal" && (
                <Input
                  name={`participants.${index}.value`}
                  aria-label={`${inputLabel} for ${member.name}`}
                  inputMode="decimal"
                  wrapperClass="expense-split-input w-20 shrink-0"
                  className="money"
                  sanitize={(value) =>
                    splitType === "percentage"
                      ? capPercentageInput(
                          value,
                          getValues("participants").filter(
                            (row, otherIndex) => otherIndex !== index && row.selected,
                          ),
                        )
                      : sanitizeSplitInput(value, splitType)
                  }
                  placeholder={
                    splitType === "percentage" && suggestedPercentage !== undefined
                      ? formatPercentageDisplay(suggestedPercentage)
                      : undefined
                  }
                />
              )}
            </div>
          </div>
        );
      })}
      {splitError && (
        <p className="text-sm money-negative" aria-live="polite">
          {splitError}
        </p>
      )}
    </fieldset>
  );
};

export default SplitEditor;
