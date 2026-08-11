import { useOutletContext } from "react-router-dom";

import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";

const MemberList = () => {
  const { groupMembers } = useOutletContext<GroupDetailContext>();

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-gray-900">Members</h2>
      <ul className="flex flex-col gap-2">
        {groupMembers.map((member) => (
          <li key={member.id} className="flex items-center gap-3 rounded border px-4 py-3">
            <span className="text-xl">{member.person?.icon}</span>
            <span className="text-sm font-medium text-gray-900">
              {member.person?.name ?? "Unknown person"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default MemberList;
