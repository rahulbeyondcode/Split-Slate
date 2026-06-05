import { useParams } from "react-router-dom";

import { useStore } from "@/shared/configs/store";

interface PropsType {
  groupId: string;
}

const HARDCODED_BALANCE = 1250;

const GroupListItem = ({ groupId }: PropsType) => {
  const { groupId: urlGroupId } = useParams();
  const { groups, members, expenses } = useStore();

  const group = groups.find((g) => g.id === groupId);
  const groupMembers = members.filter((m) => m.groupId === groupId);
  const expenseCount = expenses.filter((e) => e.groupId === groupId).length;
  const isActive = urlGroupId === groupId;

  if (!group) return null;

  const balance = HARDCODED_BALANCE;
  const balanceColor =
    balance > 0 ? "text-green-600" : balance < 0 ? "text-red-500" : "text-gray-400";
  const balancePrefix = balance > 0 ? "+" : balance < 0 ? "−" : "";

  const visibleMembers = groupMembers.slice(0, 3);
  const overflow = groupMembers.length - visibleMembers.length;

  return (
    <button
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors border ${
        isActive ? "bg-gray-100 border-gray-300" : "border-gray-200 hover:bg-gray-50"
      }`}
    >
      <span className="text-xl shrink-0">{group.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{group.name}</p>
        <div className="flex items-center mt-1">
          {visibleMembers.map((m, i) => (
            <span
              key={m.id}
              className="w-6 h-6 flex items-center justify-center text-sm rounded-full border-2 border-white bg-gray-300 leading-none shrink-0"
              style={{ marginLeft: i === 0 ? 0 : "-12px", zIndex: i }}
            >
              {m.icon}
            </span>
          ))}
          {overflow > 0 && (
            <span className="text-xs text-gray-400 ml-2">+{overflow} more</span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{expenseCount} expenses</p>
      </div>
      <div className={`text-xs font-medium shrink-0 ${balanceColor}`}>
        {balancePrefix}
        {group.currency} {Math.abs(balance).toLocaleString()}
      </div>
    </button>
  );
};

export default GroupListItem;
