import { ArrowRightLeft } from "lucide-react";
import { Link } from "react-router-dom";

import ExpenseTags from "@/features/group-detail/components/expense-tags";

import { formatCurrency } from "@/shared/utils/currency";
import { formatDisplayDateTime } from "@/shared/utils/date-time";

import type { Member, Person, Settlement, Tag } from "@/shared/types/domain.types";

import Icon from "@/shared/ui/icon";

interface PropsType {
  settlement: Settlement;
  members: (Member & { person?: Person })[];
  tags: Tag[];
  currency: string;
  to?: string;
}

const SettlementEntry = ({ settlement, members, tags, currency, to }: PropsType) => {
  const personName = (memberId: string) =>
    members.find((member) => member.id === memberId)?.person?.name ?? "Unknown person";
  const label = `${personName(settlement.fromMemberId)} paid ${personName(settlement.toMemberId)}`;
  const content = (
    <>
      <span className="settlement-entry-icon" aria-hidden="true">
        <Icon icon={ArrowRightLeft} size={21} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{label}</span>
        <span className="block text-xs">Payment · {formatDisplayDateTime(settlement.when)}</span>
      </span>
      <strong className="money whitespace-nowrap">
        {formatCurrency(settlement.amount, currency)}
      </strong>
    </>
  );
  return (
    <article className="settlement-entry">
      {to ? (
        <Link to={to} className="settlement-entry-main">
          {content}
        </Link>
      ) : (
        <div className="settlement-entry-main">{content}</div>
      )}
      <ExpenseTags
        tagIds={settlement.tagIds}
        tags={tags}
        expenseName={label}
        className="pl-12 pb-3"
      />
    </article>
  );
};

export default SettlementEntry;
