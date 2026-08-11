import { Link, Navigate, Outlet, useParams } from "react-router-dom";

import { useStore } from "@/shared/configs/store";

import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";

const GroupDetail = () => {
  const { groupId } = useParams();
  const { groups, members, people, categories, tags, expenses } = useStore();

  if (!groupId) return <Navigate to="/dashboard" replace />;

  const group = groups.find((item) => item.id === groupId);
  if (!group) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex flex-col gap-3 rounded border border-gray-200 p-5">
          <h1 className="text-xl font-semibold text-gray-900">Group not found</h1>
          <p className="text-sm text-gray-500">This group is not available on this device.</p>
          <Link to="/dashboard" className="text-sm font-medium text-blue-600">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const context: GroupDetailContext = {
    group,
    groupMembers: members
      .filter((member) => member.groupId === group.id)
      .map((member) => ({
        ...member,
        person: people.find((person) => person.id === member.personId),
      })),
    groupCategories: categories.filter((category) => category.groupId === group.id),
    groupTags: tags.filter((tag) => tag.groupId === group.id),
    groupExpenses: expenses.filter((expense) => expense.groupId === group.id),
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 pb-24 flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-4xl leading-none mb-3">{group.icon}</p>
          <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
          <p className="text-sm text-gray-500">{group.currency} group</p>
        </div>
        <Link
          to={`/groups/${group.id}/expenses`}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded self-start"
        >
          Add expense
        </Link>
      </header>

      <Outlet context={context} />
    </div>
  );
};

export default GroupDetail;
