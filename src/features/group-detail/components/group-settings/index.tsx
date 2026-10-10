import { zodResolver } from "@hookform/resolvers/zod";
import { Coins, Download, Pencil, Trash2, TriangleAlert } from "lucide-react";
import type { SyntheticEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate, useOutletContext } from "react-router-dom";
import { z } from "zod";

import StepCurrency from "@/features/create-group/components/step-currency";
import ExportPanel from "@/features/import-export/components/export-panel";
import EmojiPicker from "@/shared/components/emoji-picker";
import Input from "@/shared/components/form-elements/input";

import { useStore } from "@/shared/configs/store";
import { formatCurrency } from "@/shared/utils/currency";
import { formatDisplayDate } from "@/shared/utils/date-time";
import { createRequiredStringSchema } from "@/shared/utils/string-validation";

import { CURRENCIES } from "@/shared/constants/currencies";
import { GROUP_EMOJIS } from "@/shared/constants/emojis";
import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";

import Avatar from "@/shared/ui/avatar";
import ConfirmationDialog from "@/shared/ui/confirmation-dialog";
import DialogLayout from "@/shared/ui/dialog-layout";
import Icon from "@/shared/ui/icon";
import MobileEditorDialog from "@/shared/ui/mobile-editor-dialog";
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
  const nameInputId = useId();
  const currencyDialogRef = useRef<HTMLDialogElement>(null);
  const currencyPickerDialogRef = useRef<HTMLDialogElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const currencyButtonRef = useRef<HTMLButtonElement>(null);
  const previousEditingRef = useRef(false);
  const previousEditingCurrencyRef = useRef(false);
  const exportPanelRef = useRef<HTMLDivElement>(null);
  const { group, groupExpenses, groupSettlements, groupMembers } =
    useOutletContext<GroupDetailContext>();
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
    const confirmation = currencyDialogRef.current;
    const picker = currencyPickerDialogRef.current;
    if (pendingCurrency) {
      if (picker?.open) picker.close();
      if (!confirmation?.open) confirmation?.showModal();
    } else {
      if (confirmation?.open) confirmation.close();
      if (editingCurrency && picker && !picker.open) {
        picker.showModal();
        picker.querySelector<HTMLInputElement>('input[role="searchbox"]')?.focus({
          preventScroll: true,
        });
      } else if (!editingCurrency && picker?.open) {
        picker.close();
      }
    }
  }, [editingCurrency, pendingCurrency]);
  useEffect(() => {
    if (previousEditingRef.current && !editing) {
      editButtonRef.current?.focus({ preventScroll: true });
    }
    if (previousEditingCurrencyRef.current && !editingCurrency) {
      currencyButtonRef.current?.focus({ preventScroll: true });
    }
    previousEditingRef.current = editing;
    previousEditingCurrencyRef.current = editingCurrency;
  }, [editing, editingCurrency]);
  useEffect(() => {
    if (!showExport) return;
    const panel = exportPanelRef.current;
    const main = panel?.closest<HTMLElement>("#main-content");
    if (!panel || !main) return;
    const header = main.querySelector<HTMLElement>(".group-page-header");
    const panelTop =
      panel.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop;
    main.scrollTo({
      top: Math.max(0, panelTop - (header?.getBoundingClientRect().height ?? 0) - 12),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [showExport]);
  const handleSave = methods.handleSubmit(async (values) => {
    setError("");
    try {
      await updateGroup(group.id, values);
      setEditing(false);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not update group");
    }
  });
  const handleOpenEdit = () => {
    methods.reset({ name: group.name, icon: group.icon });
    setError("");
    setEditing(true);
  };
  const handleCancelEdit = () => {
    if (methods.formState.isSubmitting) return;
    setEditing(false);
    setError("");
    methods.reset({ name: group.name, icon: group.icon });
  };
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
    if (savingCurrency) return;
    setPendingCurrency(null);
    setCurrencyError("");
  };
  const handleDialogCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    handleCancelCurrencyChange();
  };
  const handleCancelCurrencyPicker = () => {
    if (currencyMethods.formState.isSubmitting || savingCurrency) return;
    setEditingCurrency(false);
    setCurrencyError("");
    currencyMethods.reset({ currency: group.currency });
  };
  const handleCurrencyPickerCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    handleCancelCurrencyPicker();
  };
  const handleOpenCurrency = () => {
    currencyMethods.reset({ currency: group.currency });
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
      <Surface className="group-settings-identity surface-pad flex items-center gap-3">
        <Avatar icon={group.icon} square />
        <div className="group-settings-summary flex-1">
          <p className="font-bold">{group.name}</p>
          <p className="soft-caption">
            {groupMembers.length} members · {groupExpenses.length} expenses · created{" "}
            {formatDisplayDate(group.createdAt)}
          </p>
        </div>
        <button
          ref={editButtonRef}
          type="button"
          className="group-settings-edit btn btn-secondary"
          aria-haspopup="dialog"
          onClick={handleOpenEdit}
        >
          <Icon icon={Pencil} size={18} /> Edit name & icon
        </button>
      </Surface>
      {editing && (
        <MobileEditorDialog
          title="Edit name & icon"
          onCancel={handleCancelEdit}
          busy={methods.formState.isSubmitting}
        >
          <FormProvider {...methods}>
            <form onSubmit={handleSave} className="dialog-form">
              <DialogLayout
                title="Edit name & icon"
                onClose={handleCancelEdit}
                closeDisabled={methods.formState.isSubmitting}
                bodyClassName="flex flex-col gap-4"
                footer={
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCancelEdit}
                      disabled={methods.formState.isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={methods.formState.isSubmitting}
                    >
                      Save changes
                    </button>
                  </>
                }
              >
                <div>
                  <label htmlFor={nameInputId} className="field-label">
                    Group name
                  </label>
                  <Input id={nameInputId} name="name" autoFocus />
                </div>
                <div>
                  <span className="field-label">Group icon</span>
                  <EmojiPicker name="icon" kind="other" emojis={GROUP_EMOJIS} />
                </div>
                {error && (
                  <p role="alert" className="note money-negative">
                    {error}
                  </p>
                )}
              </DialogLayout>
            </form>
          </FormProvider>
        </MobileEditorDialog>
      )}
      <Surface className="surface-pad">
        <div className="ui-row flex-wrap">
          <span className="avatar avatar-square text-[var(--brand-ink)]" aria-hidden="true">
            <Icon icon={Coins} size={26} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">Currency</p>
            <p className="soft-caption">One currency per group</p>
          </div>
          <span className="chip">{group.currency}</span>
          <button
            ref={currencyButtonRef}
            type="button"
            onClick={handleOpenCurrency}
            aria-haspopup="dialog"
            className="btn btn-secondary"
          >
            Change
          </button>
        </div>
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
      <dialog
        ref={currencyPickerDialogRef}
        aria-labelledby="currency-picker-title"
        onCancel={handleCurrencyPickerCancel}
        className="app-dialog max-w-lg rounded-3xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-2xl backdrop:bg-black/60"
      >
        {editingCurrency && (
          <FormProvider {...currencyMethods}>
            <form onSubmit={handleSaveCurrency} className="dialog-form">
              <DialogLayout
                title="Change currency"
                titleId="currency-picker-title"
                onClose={handleCancelCurrencyPicker}
                closeDisabled={currencyMethods.formState.isSubmitting || savingCurrency}
                bodyClassName="flex flex-col gap-4"
                footer={
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCancelCurrencyPicker}
                      disabled={currencyMethods.formState.isSubmitting || savingCurrency}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={currencyMethods.formState.isSubmitting || savingCurrency}
                    >
                      Save currency
                    </button>
                  </>
                }
              >
                <StepCurrency showHeading={false} />
                <p className="soft-caption">
                  Changing currency relabels existing expenses and payments without converting their
                  numeric values.
                </p>
                {currencyMethods.formState.errors.currency && (
                  <p role="alert" className="money-negative">
                    {currencyMethods.formState.errors.currency.message}
                  </p>
                )}
              </DialogLayout>
            </form>
          </FormProvider>
        )}
      </dialog>
      {showExport && (
        <Surface className="surface-pad">
          <div ref={exportPanelRef}>
            <ExportPanel
              groupId={group.id}
              groupName={group.name}
              attachmentCount={groupExpenses.reduce(
                (count, expense) => count + expense.attachmentIds.length,
                0,
              )}
            />
          </div>
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
        className="app-dialog max-w-md rounded-3xl border border-amber-400 bg-[var(--surface)] text-[var(--ink)] shadow-2xl backdrop:bg-black/60"
      >
        <DialogLayout
          title="Confirm currency change"
          titleId="currency-confirm-title"
          onClose={handleCancelCurrencyChange}
          closeDisabled={savingCurrency}
          icon={<Icon icon={TriangleAlert} size={28} className="text-amber-600" />}
          bodyClassName="flex flex-col gap-5"
          footer={
            <>
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
            </>
          }
        >
          <p className="text-sm text-[var(--muted)]">
            {group.currency} → {pendingCurrency}
          </p>
          <div
            id="currency-confirm-description"
            className="rounded-2xl border border-amber-400/60 bg-amber-500/10 p-4 text-sm leading-relaxed"
          >
            <p className="font-semibold">No exchange conversion will happen.</p>
            <p className="mt-2">
              {groupExpenses.length || groupSettlements.length
                ? `All ${groupExpenses.length} expenses and ${groupSettlements.length} payments keep the same numeric amounts. Balances and exports will show the new currency label.`
                : "This group has no expenses or payments yet. Future amounts will use the new currency label."}
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
        </DialogLayout>
      </dialog>
    </section>
  );
};

export default GroupSettings;
