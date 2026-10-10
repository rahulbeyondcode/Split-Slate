import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import MemberPicker from "@/features/settlements/components/member-picker";
import Input from "@/shared/components/form-elements/input";

import type { SettlementFormValues } from "@/features/settlements/utils/settlement-schema";
import { createSettlementSchema } from "@/features/settlements/utils/settlement-schema";
import { calculateBalances } from "@/shared/utils/balances";
import { moneyToDecimal, parseMoney } from "@/shared/utils/money";

import type { SettlementInput } from "@/features/settlements/types/settlements.types";
import type { Expense, Group, Member, Person, Settlement, Tag } from "@/shared/types/domain.types";

import DialogLayout from "@/shared/ui/dialog-layout";
import WhenPicker from "@/shared/ui/when-picker";

interface PropsType {
  group: Group;
  members: (Member & { person?: Person })[];
  expenses: Expense[];
  settlements: Settlement[];
  tags: Tag[];
  initial?: Settlement;
  suggested?: { fromMemberId: string; toMemberId: string; amount: number };
  onSave: (input: SettlementInput) => Promise<void>;
  onCancel: () => void;
}

const localDateTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const SettlementForm = ({
  group,
  members,
  expenses,
  settlements,
  tags,
  initial,
  suggested,
  onSave,
  onCancel,
}: PropsType) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [openedAt] = useState(Date.now);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);
  const methods = useForm<SettlementFormValues>({
    resolver: zodResolver(createSettlementSchema(group.currency)),
    defaultValues: {
      fromMemberId: initial?.fromMemberId ?? suggested?.fromMemberId ?? "",
      toMemberId: initial?.toMemberId ?? suggested?.toMemberId ?? "",
      amount:
        initial || suggested ? moneyToDecimal((initial ?? suggested)!.amount, group.currency) : "",
      when: initial ? localDateTime(initial.when) : "",
      tagIds: initial?.tagIds ?? [],
    },
  });
  const [fromMemberId, toMemberId, enteredAmount] = useWatch({
    control: methods.control,
    name: ["fromMemberId", "toMemberId", "amount"],
  });
  const balances = calculateBalances(
    expenses,
    members.map((member) => member.id),
    settlements.filter((item) => item.id !== initial?.id),
  );
  const maximum = Math.min(-(balances.get(fromMemberId) ?? 0), balances.get(toMemberId) ?? 0);
  let overpayment = false;
  try {
    overpayment =
      Boolean(fromMemberId && toMemberId && fromMemberId !== toMemberId) &&
      parseMoney(enteredAmount, group.currency) > Math.max(0, maximum);
  } catch {
    // Validation displays the input error instead.
  }
  const handleCancel = (event: React.SyntheticEvent<HTMLDialogElement>) => {
    if (methods.formState.isSubmitting) event.preventDefault();
    else onCancel();
  };
  const handleSubmit = methods.handleSubmit(async (values) => {
    try {
      await onSave({
        groupId: group.id,
        fromMemberId: values.fromMemberId,
        toMemberId: values.toMemberId,
        amount: parseMoney(values.amount, group.currency),
        when:
          initial && localDateTime(initial.when) === values.when
            ? initial.when
            : new Date(values.when).getTime(),
        tagIds: values.tagIds,
      });
    } catch (failure) {
      methods.setError("root", {
        message: failure instanceof Error ? failure.message : "Could not record this payment",
      });
    }
  });
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      className="app-dialog max-w-xl rounded-3xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-2xl backdrop:bg-black/60"
    >
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit} className="dialog-form" noValidate>
          <DialogLayout
            title={initial ? "Edit payment" : "Record payment"}
            titleId={titleId}
            onClose={onCancel}
            closeDisabled={methods.formState.isSubmitting}
            bodyClassName="flex flex-col gap-4"
            footer={
              <>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={methods.formState.isSubmitting}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={methods.formState.isSubmitting}
                  className="btn btn-primary"
                >
                  {initial ? "Save payment" : "Record payment"}
                </button>
              </>
            }
          >
            <p className="soft-caption">
              Record money sent outside Split Slate in this group only.
            </p>
            <fieldset disabled={methods.formState.isSubmitting} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <MemberPicker name="fromMemberId" label="Paid by" members={members} />
                <MemberPicker name="toMemberId" label="Received by" members={members} />
              </div>
              <label className="block">
                <span className="field-label">Amount ({group.currency})</span>
                <Input name="amount" inputMode="decimal" placeholder="0.00" />
              </label>
              <WhenPicker defaultDate={localDateTime(openedAt).slice(0, 10)} />
              {tags.length > 0 && (
                <fieldset>
                  <legend className="field-label">Tags (optional)</legend>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <label
                        key={tag.id}
                        className="choice-option choice-option-compact min-w-0 max-w-full !gap-2 !text-xs"
                      >
                        <input
                          type="checkbox"
                          value={tag.id}
                          {...methods.register("tagIds")}
                          className="choice-control"
                        />
                        <span
                          aria-hidden="true"
                          className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/10"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="min-w-0 break-words">{tag.name}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
            </fieldset>
            {overpayment && (
              <p role="status" className="note">
                This exceeds the current suggested payment and may reverse who owes whom. You can
                still record what actually happened.
              </p>
            )}
            {methods.formState.errors.root && (
              <p role="alert" className="money-negative text-sm">
                {methods.formState.errors.root.message}
              </p>
            )}
          </DialogLayout>
        </form>
      </FormProvider>
    </dialog>
  );
};

export default SettlementForm;
