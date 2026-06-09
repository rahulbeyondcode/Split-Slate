import { Link } from "react-router-dom";

import { useStore } from "@/shared/configs/store";

const Dashboard = () => {
  const { localUser, groups } = useStore();

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Hi, {localUser?.name ?? "there"} {localUser?.icon}
          </h1>
          <p className="text-sm text-gray-500">Your groups</p>
        </div>
        <Link to="/groups/new" className="px-4 py-2 bg-gray-900 text-white text-sm rounded shrink-0">
          New group
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm text-gray-500">No groups yet.</p>
          <Link to="/groups/new" className="px-4 py-2 bg-gray-900 text-white text-sm rounded">
            Create your first group
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {groups.map((group) => (
            <li key={group.id}>
              <Link
                to={`/groups/${group.id}`}
                className="flex items-center gap-3 px-4 py-3 border rounded hover:bg-gray-50"
              >
                <span className="text-2xl">{group.icon}</span>
                <span className="flex-1 text-sm font-medium">{group.name}</span>
                <span className="text-xs text-gray-400">{group.currency}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dashboard;
