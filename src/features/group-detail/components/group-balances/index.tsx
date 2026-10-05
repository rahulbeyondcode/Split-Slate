import { ArrowLeft, ArrowRight, CircleCheck, Plus } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";

import SettlementEntry from "@/features/settlements/components/settlement-entry";
import SettlementForm from "@/features/settlements/components/settlement-form";

import { useStore } from "@/shared/configs/store";
import { calculateBalances, suggestTransfers } from "@/shared/utils/balances";
import { formatCurrency } from "@/shared/utils/currency";

import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";
import type { SettlementInput } from "@/features/settlements/types/settlements.types";
import type { Settlement } from "@/shared/types/domain.types";

import Avatar from "@/shared/ui/avatar";
import ConfirmationDialog from "@/shared/ui/confirmation-dialog";
import EmptyState from "@/shared/ui/empty-state";
import Icon from "@/shared/ui/icon";
import Surface from "@/shared/ui/surface";

const GroupBalances = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { group, groupMembers, groupExpenses, groupSettlements, groupTags } =
    useOutletContext<GroupDetailContext>();
  const { addSettlement, updateSettlement, removeSettlement } = useStore();
  const [editing, setEditing] = useState<Settlement | null>(null);
  const [suggested, setSuggested] = useState<{
    fromMemberId: string;
    toMemberId: string;
    amount: number;
  } | null>(null);
  const [showForm, setShowForm] = useState(
    () => groupMembers.length > 1 && new URLSearchParams(location.search).has("record"),
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  let balances: Map<string, number>;
  let transfers: ReturnType<typeof suggestTransfers>;
  try {
    balances = calculateBalances(
      groupExpenses,
      groupMembers.map((member) => member.id),
      groupSettlements,
    );
    transfers = suggestTransfers(balances);
  } catch (error) {
    return (
      <p role="alert" className="note money-negative">
        {error instanceof Error ? error.message : "Could not calculate balances"}
      </p>
    );
  }
  const person = (id: string) => groupMembers.find((member) => member.id === id)?.person;
  const handleRecord = () => {
    setEditing(null);
    setSuggested(null);
    setShowForm(true);
  };
  const handleCancel = () => {
    setEditing(null);
    setSuggested(null);
    setShowForm(false);
  };
  const handleSave = async (input: SettlementInput) => {
    if (editing) await updateSettlement(editing.id, input);
    else await addSettlement(input);
    handleCancel();
  };
  const handleSettleUp = (transfer: ReturnType<typeof suggestTransfers>[number]) => {
    setEditing(null);
    setSuggested(transfer);
    setShowForm(true);
  };
  const handleEdit = (settlement: Settlement) => {
    setEditing(settlement);
    setSuggested(null);
    setShowForm(true);
  };
  const handleDelete = async () => {
    if (!deletingId) return;
    await removeSettlement(deletingId, group.id);
    setDeletingId(null);
  };
  const handleBack = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate(`/groups/${group.id}/expenses`);
    }
  };
  return (
    <div className="flex flex-col gap-3">
      <button type="button" className="page-back-link" onClick={handleBack}>
        <Icon icon={ArrowLeft} size={18} /> Back
      </button>
      <div className="flex items-center justify-between gap-3">
        <p className="soft-caption">
          Payments are recorded here for this group only; Split Slate does not move money.
        </p>
        {groupMembers.length > 1 && (
          <button type="button" className="btn btn-primary shrink-0" onClick={handleRecord}>
            <Icon icon={Plus} size={18} /> Add payment
          </button>
        )}
      </div>
      {showForm && (
        <SettlementForm
          key={editing?.id ?? `${suggested?.fromMemberId ?? "new"}-${suggested?.toMemberId ?? ""}`}
          group={group}
          members={groupMembers}
          expenses={groupExpenses}
          settlements={groupSettlements}
          tags={groupTags}
          initial={editing ?? undefined}
          suggested={suggested ?? undefined}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
      <div className="responsive-grid balances-summary-grid">
        <Surface className="surface-pad">
          <h2 className="section-title mb-3">Net per member</h2>
          <ul aria-label="Member balances">
            {groupMembers.map((member) => {
              const net = balances.get(member.id) ?? 0;
              return (
                <li key={member.id} className="ui-row">
                  <Avatar icon={member.person?.icon} name={member.person?.name} />
                  <span className="flex-1 font-bold">
                    {member.person?.name ?? "Unknown person"}
                  </span>
                  <span
                    className={`money font-bold ${net > 0 ? "money-positive" : net < 0 ? "money-negative" : "muted"}`}
                  >
                    {net > 0 ? "+" : net < 0 ? "−" : ""}
                    {formatCurrency(Math.abs(net), group.currency)}
                  </span>
                </li>
              );
            })}
          </ul>
        </Surface>
        <Surface className="surface-pad">
          <h2 className="section-title mb-3">Who owes whom</h2>
          <section aria-label="Suggested payments">
            {transfers.length ? (
              <ul className="suggested-transfer-list">
                {transfers.map((transfer) => (
                  <li
                    key={`${transfer.fromMemberId}-${transfer.toMemberId}`}
                    className="suggested-transfer"
                  >
                    <div className="suggested-transfer-people">
                      <span className="transfer-person suggested-transfer-party">
                        <span className="suggested-transfer-label">From</span>
                        <span className="suggested-transfer-identity">
                          <Avatar icon={person(transfer.fromMemberId)?.icon} />
                          <span className="suggested-transfer-name">
                            {person(transfer.fromMemberId)?.name ?? "Unknown"}
                          </span>
                        </span>
                      </span>
                      <span className="suggested-transfer-arrow" aria-hidden="true">
                        <Icon icon={ArrowRight} size={16} />
                      </span>
                      <span className="transfer-person suggested-transfer-party">
                        <span className="suggested-transfer-label">To</span>
                        <span className="suggested-transfer-identity">
                          <Avatar icon={person(transfer.toMemberId)?.icon} />
                          <span className="suggested-transfer-name">
                            {person(transfer.toMemberId)?.name ?? "Unknown"}
                          </span>
                        </span>
                      </span>
                    </div>
                    <div className="suggested-transfer-actions">
                      <span className="suggested-transfer-amount">
                        <span className="suggested-transfer-label">Amount</span>
                        <strong className="money">
                          {formatCurrency(transfer.amount, group.currency)}
                        </strong>
                      </span>
                      <button
                        type="button"
                        className="settle-up-button"
                        onClick={() => handleSettleUp(transfer)}
                      >
                        Settle up
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={CircleCheck}
                title="All square!"
                description={
                  groupMembers.length === 1
                    ? "Solo spending has no one to repay."
                    : "No payments needed."
                }
              />
            )}
          </section>
        </Surface>
      </div>
      <Surface className="surface-pad">
        <h2 className="section-title mb-3">Recorded payments</h2>
        {groupSettlements.length ? (
          <ul aria-label="Recorded payments" className="flex flex-col gap-2">
            {[...groupSettlements]
              .sort((a, b) => b.when - a.when || a.id.localeCompare(b.id))
              .map((settlement) => (
                <li key={settlement.id}>
                  <SettlementEntry
                    settlement={settlement}
                    members={groupMembers}
                    tags={groupTags}
                    currency={group.currency}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary !px-3"
                      onClick={() => handleEdit(settlement)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger !px-3"
                      onClick={() => setDeletingId(settlement.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        ) : (
          <p className="soft-caption">No payments recorded in this group yet.</p>
        )}
      </Surface>
      <ConfirmationDialog
        open={deletingId !== null}
        title="Delete this payment?"
        description="This removes the record and recalculates the group's balances. It does not reverse a real-world transfer."
        confirmLabel="Delete payment"
        onCancel={() => setDeletingId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default GroupBalances;
