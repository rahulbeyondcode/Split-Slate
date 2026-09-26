import { useOutletContext } from "react-router-dom";

import ExportPanel from "@/features/import-export/components/export-panel";

import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";

const GroupSettings = () => {
  const { group, groupExpenses } = useOutletContext<GroupDetailContext>();

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="rounded border border-gray-200 p-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Name</dt>
          <dd className="mt-1 text-sm text-gray-900">{group.name}</dd>
        </div>
        <div className="rounded border border-gray-200 p-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Currency</dt>
          <dd className="mt-1 text-sm text-gray-900">{group.currency}</dd>
        </div>
      </dl>
      <div className="mt-5 border-t border-gray-200 pt-5">
        <ExportPanel
          groupId={group.id}
          groupName={group.name}
          attachmentCount={groupExpenses.reduce(
            (count, expense) => count + expense.attachmentIds.length,
            0,
          )}
        />
      </div>
    </section>
  );
};

export default GroupSettings;
