import { zodResolver } from "@hookform/resolvers/zod";
import { Download, Pencil, Trash2, TriangleAlert } from "lucide-react";
import type { SyntheticEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate, useOutletContext } from "react-router-dom";
import { z } from "zod";

import StepCurrency from "@/features/create-group/components/step-currency";
import ExportPanel from "@/features/import-export/components/export-panel";
import EmojiPicker from "@/shared/components/emoji-picker";
import Input from "@/shared/components/form-elements/input";

import { useStore } from "@/shared/configs/store";
import { formatCurrency } from "@/shared/utils/currency";
import { createRequiredStringSchema } from "@/shared/utils/string-validation";

import { CURRENCIES } from "@/shared/constants/currencies";
import { GROUP_EMOJIS } from "@/shared/constants/emojis";
import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";

import Avatar from "@/shared/ui/avatar";
import ConfirmationDialog from "@/shared/ui/confirmation-dialog";
import Icon from "@/shared/ui/icon";
import Surface from "@/shared/ui/surface";

const schema = z.object({
  name: createRequiredStringSchema("Group name is required"),
  icon: createRequiredStringSchema("Choose a group icon"),
});
type Values = z.infer<typeof schema>;
const currencySchema = z.object({
  currency: z
    .string()
    .refine((value) => CURRENCIES.some((item) => item.code === value), "Choose a currency"),
});
type CurrencyValues = z.infer<typeof currencySchema>;

const GroupSettings = () => {
  const navigate = useNavigate();
  const currencyDialogRef = useRef<HTMLDialogElement>(null);
  const { group, groupExpenses, groupMembers } = useOutletContext<GroupDetailContext>();
  const updateGroup = useStore((state) => state.updateGroup);
  const removeGroup = useStore((state) => state.removeGroup);
  const [confirmingDeletion, setConfirmingDeletion] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(false);
  const [pendingCurrency, setPendingCurrency] = useState<string | null>(null);
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [error, setError] = useState("");
  const [currencyError, setCurrencyError] = useState("");
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    values: { name: group.name, icon: group.icon },
  });
  const currencyMethods = useForm<CurrencyValues>({
    resolver: zodResolver(currencySchema),
    values: { currency: group.currency },
  });
  useEffect(() => {
    const dialog = currencyDialogRef.current;
    if (pendingCurrency && !dialog?.open) dialog?.showModal();
    if (!pendingCurrency && dialog?.open) dialog.close();
  }, [pendingCurrency]);
  const handleSave = methods.handleSubmit(async (values) => {
    setError("");
    try {
      await updateGroup(group.id, values);
      setEditing(false);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not update group");
    }
  });
  const handleSaveCurrency = currencyMethods.handleSubmit(({ currency }) => {
    if (currency === group.currency) {
      setEditingCurrency(false);
      return;
    }
    setCurrencyError("");
    setPendingCurrency(currency);
  });
  const handleConfirmCurrency = async () => {
    if (!pendingCurrency) return;
    setSavingCurrency(true);
    setCurrencyError("");
    try {
      await updateGroup(group.id, { currency: pendingCurrency });
      setPendingCurrency(null);
      setEditingCurrency(false);
    } catch (failure) {
      setCurrencyError(failure instanceof Error ? failure.message : "Could not update currency");
    } finally {
      setSavingCurrency(false);
    }
  };
  const handleCancelCurrencyChange = () => {
    setPendingCurrency(null);
    setCurrencyError("");
  };
  const handleDialogCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    if (savingCurrency) event.preventDefault();
  };
  const handleOpenCurrency = () => {
    setCurrencyError("");
    setEditingCurrency(true);
  };
  const handleDeleteGroup = async () => {
    await removeGroup(group.id);
    setConfirmingDeletion(false);
    navigate("/dashboard", { replace: true });
  };

  return (
    <section className="flex flex-col gap-5">
      <h2 className="section-title">Group settings</h2>
      {editing ? (
        <FormProvider {...methods}>
          <form onSubmit={handleSave} className="surface surface-pad flex flex-col gap-4">
            <h2 className="section-title">Edit name & icon</h2>
            <label>
              <span className="field-label">Group name</span>
              <Input name="name" />
            </label>
            <label>
              <span className="field-label">Group icon</span>
              <EmojiPicker name="icon" kind="other" emojis={GROUP_EMOJIS} />
            </label>
            {error && (
              <p role="alert" className="note money-negative">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={methods.formState.isSubmitting}
              >
                Save changes
              </button>
            </div>
          </form>
        </FormProvider>
      ) : (
        <Surface className="surface-pad flex items-center gap-3">
          <Avatar icon={group.icon} square />
          <div className="flex-1">
            <p className="font-bold">{group.name}</p>
            <p className="soft-caption">
              {groupMembers.length} members · {groupExpenses.length} expenses · created{" "}
              {new Intl.DateTimeFormat(undefined, {
                day: "numeric",
                month: "short",
                year: "numeric",
              }).format(group.createdAt)}
            </p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)}>
            <Icon icon={Pencil} size={18} /> Edit name & icon
          </button>
        </Surface>
      )}
      <Surface className="surface-pad">
        <div className="ui-row flex-wrap">
          <Avatar
            icon={CURRENCIES.find((item) => item.code === group.currency)?.symbol ?? "¤"}
            square
          />
          <div className="min-w-0 flex-1">
            <p className="font-bold">Currency</p>
            <p className="soft-caption">One currency per group</p>
          </div>
          <span className="chip">{group.currency}</span>
          {!editingCurrency && (
            <button type="button" onClick={handleOpenCurrency} className="btn btn-secondary">
              Change
            </button>
          )}
        </div>
        {editingCurrency && (
          <FormProvider {...currencyMethods}>
            <form onSubmit={handleSaveCurrency} className="flex flex-col gap-3 py-4">
              <StepCurrency showHeading={false} />
              <p className="soft-caption">
                Changing currency relabels existing amounts without converting their numeric values.
              </p>
              {currencyMethods.formState.errors.currency && (
                <p role="alert" className="money-negative">
                  {currencyMethods.formState.errors.currency.message}
                </p>
              )}
              {currencyError && (
                <p role="alert" className="money-negative">
                  {currencyError}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingCurrency(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={currencyMethods.formState.isSubmitting}
                >
                  Save currency
                </button>
              </div>
            </form>
          </FormProvider>
        )}
        <div className="ui-row">
          <span className="avatar avatar-square text-[var(--brand-ink)]">
            <Icon icon={Download} size={26} />
          </span>
          <div className="flex-1">
            <p className="font-bold">Export</p>
            <p className="soft-caption">Transfer selected group data via Link, CSV or ZIP</p>
          </div>
          <button
            type="button"
            onClick={() => setShowExport((value) => !value)}
            aria-expanded={showExport}
            className="btn btn-secondary"
          >
            {showExport ? "Hide export" : "Export group"}
          </button>
        </div>
      </Surface>
      {showExport && (
        <Surface className="surface-pad">
          <ExportPanel
            groupId={group.id}
            groupName={group.name}
            attachmentCount={groupExpenses.reduce(
              (count, expense) => count + expense.attachmentIds.length,
              0,
            )}
          />
        </Surface>
      )}
      <Surface className="surface-pad flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-bold">Delete this group</p>
          <p className="soft-caption">
            Permanently removes the group and its data. Shared contacts remain.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => setConfirmingDeletion(true)}
        >
          <Icon icon={Trash2} size={18} /> Delete group
        </button>
      </Surface>
      <ConfirmationDialog
        open={confirmingDeletion}
        title={`Delete ${group.name}?`}
        description={
          <>
            Deleting this group is permanent and cannot be undone. All its expenses, members,
            categories, tags, and receipts will be deleted. Your shared contacts and other groups
            will remain. Download an app backup from Settings first if you may need this data.
          </>
        }
        confirmLabel="Delete group permanently"
        onCancel={() => setConfirmingDeletion(false)}
        onConfirm={handleDeleteGroup}
      />
      <dialog
        ref={currencyDialogRef}
        aria-labelledby="currency-confirm-title"
        aria-describedby="currency-confirm-description"
        onCancel={handleDialogCancel}
        onClose={handleCancelCurrencyChange}
        className="m-auto w-full max-w-md rounded-3xl border border-amber-400 bg-[var(--surface)] p-6 text-[var(--ink)] shadow-2xl backdrop:bg-black/60"
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600"
            >
              <Icon icon={TriangleAlert} size={28} />
            </span>
            <div>
              <h2 id="currency-confirm-title" className="text-xl font-bold">
                Confirm currency change
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {group.currency} → {pendingCurrency}
              </p>
            </div>
          </div>
          <div
            id="currency-confirm-description"
            className="rounded-2xl border border-amber-400/60 bg-amber-500/10 p-4 text-sm leading-relaxed"
          >
            <p className="font-semibold">No exchange conversion will happen.</p>
            <p className="mt-2">
              {groupExpenses.length > 0
                ? `All ${groupExpenses.length} existing ${groupExpenses.length === 1 ? "expense keeps" : "expenses keep"} the same numeric amounts. Balances and exports will show the new currency label.`
                : "This group has no expenses yet. Future amounts will use the new currency label."}
            </p>
            {pendingCurrency && (
              <p className="mt-2 font-bold">
                For example, {formatCurrency(100000, group.currency)} becomes{" "}
                {formatCurrency(100000, pendingCurrency)}.
              </p>
            )}
          </div>
          {currencyError && (
            <p role="alert" className="text-sm money-negative">
              {currencyError}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              autoFocus
              disabled={savingCurrency}
              onClick={handleCancelCurrencyChange}
              className="btn btn-secondary"
            >
              Keep current currency
            </button>
            <button
              type="button"
              disabled={savingCurrency}
              onClick={handleConfirmCurrency}
              className="btn bg-amber-600 text-white hover:bg-amber-700"
            >
              {savingCurrency ? "Changing…" : "Change currency"}
            </button>
          </div>
        </div>
      </dialog>
    </section>
  );
};

export default GroupSettings;
