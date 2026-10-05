import { Link, useParams } from "react-router-dom";

import { useStore } from "@/shared/configs/store";
import { calculateMemberNet } from "@/shared/utils/balances";
import { formatCurrency } from "@/shared/utils/currency";

import Avatar from "@/shared/ui/avatar";

interface PropsType {
  groupId: string;
}

const GroupListItem = ({ groupId }: PropsType) => {
  const { groupId: currentId } = useParams();
  const { groups, members, expenses, settlements, localUser } = useStore();
  const group = groups.find((item) => item.id === groupId);
  if (!group) return null;
  const entries = expenses.filter((expense) => expense.groupId === groupId);
  const person = members.find(
    (member) => member.groupId === groupId && member.personId === localUser?.id,
  );
  const amount = person
    ? calculateMemberNet(
        entries,
        person.id,
        settlements.filter((item) => item.groupId === groupId),
      )
    : 0;
  return (
    <Link
      to={`/groups/${groupId}`}
      className={`side-group ${currentId === groupId ? "active" : ""}`}
    >
      <Avatar icon={group.icon} square className="!h-9 !w-9 !text-lg" />
      <span className="flex-1 min-w-0">
        <span className="block truncate text-xs font-bold">{group.name}</span>
        <span className="soft-caption block truncate">
          {members.filter((member) => member.groupId === groupId).length} members · {entries.length}{" "}
          expenses
        </span>
      </span>
      <strong
        className={`money text-xs ${amount > 0 ? "money-positive" : amount < 0 ? "money-negative" : "muted"}`}
      >
        {amount > 0 ? "+" : amount < 0 ? "−" : ""}
        {formatCurrency(Math.abs(amount), group.currency)}
      </strong>
    </Link>
  );
};

export default GroupListItem;
