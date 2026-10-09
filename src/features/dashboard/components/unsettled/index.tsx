import { ArrowLeft, CircleCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { dashboardPositions, dashboardTransfers } from "@/features/dashboard/utils/dashboard-data";
import { useStore } from "@/shared/configs/store";
import { formatCurrency } from "@/shared/utils/currency";

import Avatar from "@/shared/ui/avatar";
import EmptyState from "@/shared/ui/empty-state";
import Icon from "@/shared/ui/icon";
import Surface from "@/shared/ui/surface";

const Unsettled = () => {
  const state = useStore();
  const navigate = useNavigate();
  const transfers = dashboardTransfers(state);
  const { currency, get, give } = dashboardPositions(state);
  const handleBack = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };
  return (
    <div className="page page-narrow mobile-sticky-page dashboard-detail-page">
      <header className="mb-0">
        <button type="button" onClick={handleBack} className="page-back-link mb-3">
          <Icon icon={ArrowLeft} size={18} /> Back
        </button>
        <h1 className="page-title">Unsettled</h1>
      </header>
      <p className="soft-caption mb-5">
        Suggested transfers between you and others · record payments within each group
      </p>
      {currency && (
        <Surface className="surface-pad mb-4">
          <div className="flex justify-between gap-5 text-xs font-bold">
            <span className="money-positive">↓ get {formatCurrency(get, currency)}</span>
            <span className="money-negative">↑ give {formatCurrency(give, currency)}</span>
          </div>
          <div className="mt-3 flex h-2 gap-1">
            <span
              className="rounded-l-full bg-[var(--positive)]"
              style={{ width: `${get + give ? (get / (get + give)) * 100 : 50}%` }}
            />
            <span className="flex-1 rounded-r-full bg-[var(--negative)]" />
          </div>
        </Surface>
      )}
      {transfers.length ? (
        <Surface className="surface-pad">
          {transfers.map((item) => (
            <Link key={item.key} to={`/groups/${item.group.id}/balances`} className="ui-row">
              <Avatar icon={item.person?.icon} name={item.person?.name} />
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {item.incoming
                    ? `${item.person?.name ?? "Someone"} owes you`
                    : `You owe ${item.person?.name ?? "someone"}`}
                </p>
                <p className="soft-caption">{item.group.name}</p>
              </div>
              <span
                className={`money font-bold ${item.incoming ? "money-positive" : "money-negative"}`}
              >
                {item.incoming ? "+" : "−"}
                {formatCurrency(item.amount, item.group.currency)}
              </span>
            </Link>
          ))}
        </Surface>
      ) : (
        <EmptyState
          icon={CircleCheck}
          title="All square!"
          description="No unsettled balances in your groups."
        />
      )}
    </div>
  );
};

export default Unsettled;
