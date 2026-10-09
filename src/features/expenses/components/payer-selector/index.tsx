import { useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import Input from "@/shared/components/form-elements/input";

import { previewPayerContributions } from "@/features/expenses/utils/payer-contributions";
import { sanitizeDecimalInput } from "@/features/expenses/utils/split-input";
import { formatCurrency } from "@/shared/utils/currency";
import { moneyToDecimal } from "@/shared/utils/money";

import type { ExpenseFormValues, PayerMember } from "@/features/expenses/types/expenses.types";

import Avatar from "@/shared/ui/avatar";

interface PropsType {
  members: PayerMember[];
  quickIds: string[];
  currency: string;
  validationMessage?: string;
}

const PayerSelector = ({ members, quickIds, currency, validationMessage }: PropsType) => {
  const { register, control, getValues, setValue } = useFormContext<ExpenseFormValues>();
  const [mode, selected, payers, total] = useWatch({
    control,
    name: ["payerMode", "payerId", "payers", "amount"],
  });
  const [showAll, setShowAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() =>
    getValues("payers")
      .filter((payer) => payer.selected)
      .map((payer) => payer.memberId),
  );
  const editedOrder = useRef(
    getValues("payers")
      .filter((payer) => payer.selected && payer.amount.trim())
      .map((payer) => payer.memberId)
      .slice(0, -1),
  );
  const initialRemainder = useRef(
    getValues("payerMode") === "multiple"
      ? getValues("payers")
          .filter((payer) => payer.selected && payer.amount.trim())
          .at(-1)?.memberId
      : undefined,
  );
  const visibleIds = showAll
    ? members.map((member) => member.id)
    : [...new Set([...quickIds, selected, ...selectedIds])];
  const chosenPayers = selectedIds.flatMap((id) =>
    payers.filter((payer) => payer.memberId === id && payer.selected),
  );
  const preview = previewPayerContributions(
    total,
    chosenPayers.map((payer) => ({ memberId: payer.memberId, value: payer.amount })),
    currency,
  );
  const payerValidation = /payer|who paid/iu.test(validationMessage ?? "") ? validationMessage : "";
  const payerError = preview.error || (!preview.paid.length ? payerValidation : "");

  const handleTogglePayer = (id: string, index: number) => {
    const next = !getValues(`payers.${index}.selected`);
    setValue(`payers.${index}.selected`, next, { shouldDirty: true, shouldValidate: true });
    if (!next) {
      setValue(`payers.${index}.amount`, "", { shouldDirty: true, shouldValidate: true });
      editedOrder.current = editedOrder.current.filter((item) => item !== id);
      if (initialRemainder.current === id) initialRemainder.current = undefined;
      const remainingIds = selectedIds.filter((item) => item !== id);
      const current = getValues("payers");
      if (
        remainingIds.length &&
        (remainingIds.length === 1 ||
          remainingIds.every((memberId) =>
            current.find((payer) => payer.memberId === memberId)?.amount.trim(),
          ))
      ) {
        const suggestedId =
          editedOrder.current.find((memberId) => remainingIds.includes(memberId)) ??
          remainingIds[0];
        const suggestedIndex = current.findIndex((payer) => payer.memberId === suggestedId);
        setValue(`payers.${suggestedIndex}.amount`, "", {
          shouldDirty: true,
          shouldValidate: true,
        });
        editedOrder.current = editedOrder.current.filter((item) => item !== suggestedId);
        if (initialRemainder.current === suggestedId) initialRemainder.current = undefined;
      }
    }
    setSelectedIds((current) => (next ? [...current, id] : current.filter((item) => item !== id)));
  };

  const handlePayerAmountChange = (id: string, value: string) => {
    if (!value.trim()) {
      editedOrder.current = editedOrder.current.filter((item) => item !== id);
      if (initialRemainder.current === id) initialRemainder.current = undefined;
      return;
    }
    if (initialRemainder.current && initialRemainder.current !== id) {
      const initialIndex = getValues("payers").findIndex(
        (payer) => payer.memberId === initialRemainder.current,
      );
      if (initialIndex >= 0) {
        setValue(`payers.${initialIndex}.amount`, "", { shouldDirty: true, shouldValidate: true });
      }
      initialRemainder.current = undefined;
    }
    if (editedOrder.current.includes(id)) return;
    const current = getValues("payers");
    const otherBlank = selectedIds.some(
      (memberId) =>
        memberId !== id && !current.find((payer) => payer.memberId === memberId)?.amount.trim(),
    );
    if (!otherBlank) {
      const firstEdited = editedOrder.current[0];
      const firstIndex = current.findIndex((payer) => payer.memberId === firstEdited);
      if (firstIndex >= 0) {
        setValue(`payers.${firstIndex}.amount`, "", { shouldDirty: true, shouldValidate: true });
        editedOrder.current = editedOrder.current.filter((memberId) => memberId !== firstEdited);
        initialRemainder.current = undefined;
      }
    }
    editedOrder.current.push(id);
  };

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="field-label">Paid by</legend>
      <div className="flex flex-wrap gap-2 text-sm">
        <label className="choice-option choice-option-compact">
          <input
            type="radio"
            value="single"
            {...register("payerMode")}
            className="choice-control"
          />
          One person
        </label>
        <label className="choice-option choice-option-compact">
          <input
            type="radio"
            value="multiple"
            {...register("payerMode")}
            className="choice-control"
          />
          Multiple payers
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        {visibleIds.map((id) => {
          const member = members.find((item) => item.id === id);
          const index = payers.findIndex((payer) => payer.memberId === id);
          if (!member || index < 0) return null;
          return (
            <label key={id} className="cursor-pointer">
              {mode === "single" ? (
                <input
                  type="radio"
                  value={id}
                  aria-label={`Paid by ${member.name}`}
                  {...register("payerId")}
                  className="peer sr-only"
                />
              ) : (
                <input
                  type="checkbox"
                  checked={payers[index].selected}
                  onChange={() => handleTogglePayer(id, index)}
                  aria-label={`Paid by ${member.name}`}
                  className="peer sr-only"
                />
              )}
              <span className="chip choice-chip payer-choice-chip">
                <Avatar icon={member.icon} name={member.name} />
                <span className="min-w-0 break-words">{member.name}</span>
              </span>
            </label>
          );
        })}
      </div>
      {!showAll && members.some((member) => !visibleIds.includes(member.id)) && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="btn btn-secondary self-start"
        >
          Show more payers
        </button>
      )}
      {mode === "single" && payerValidation && (
        <p className="text-sm money-negative" aria-live="polite">
          {payerValidation}
        </p>
      )}
      {mode === "multiple" && (
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-extrabold leading-snug text-[var(--ink)]">
            Amount paid by each person ({currency})
          </h3>
          {selectedIds.length === 0 && (
            <p className="soft-caption">Select the people who paid to enter their amounts.</p>
          )}
          {selectedIds.map((id) => {
            const member = members.find((item) => item.id === id);
            const index = payers.findIndex((payer) => payer.memberId === id);
            if (!member || index < 0 || !payers[index].selected) return null;
            const paid = preview.paid.find((payer) => payer.memberId === id)?.amount ?? 0;
            return (
              <div key={id} className="ui-row expense-payer-row">
                <span className="expense-payer-member flex min-w-0 items-center gap-2 text-sm">
                  <Avatar icon={member.icon} name={member.name} />
                  <span className="min-w-0 break-words">{member.name}</span>
                </span>
                <span className="expense-payer-preview money ml-auto text-sm font-semibold">
                  {formatCurrency(paid, currency)}
                </span>
                <Input
                  name={`payers.${index}.amount`}
                  aria-label={`${member.name} paid (${currency})`}
                  inputMode="decimal"
                  wrapperClass="expense-payer-input w-20 shrink-0"
                  className="money"
                  sanitize={sanitizeDecimalInput}
                  onValueChange={(value) => handlePayerAmountChange(id, value)}
                  placeholder={moneyToDecimal(paid, currency)}
                  disabled={selectedIds.length === 1}
                />
              </div>
            );
          })}
          {payerError && (
            <p className="text-sm money-negative" aria-live="polite">
              {payerError}
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
};

export default PayerSelector;
