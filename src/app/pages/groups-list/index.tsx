import { useStore } from "@/shared/configs/store";

const GroupsList = () => {
  const { localUser, groups } = useStore();

  return (
    <div className="flex flex-col h-svh p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">My Groups</h1>
        {localUser && (
          <span className="text-2xl" title={localUser.name}>
            {localUser.icon}
          </span>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          No groups yet.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {groups
            .slice()
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((g) => (
              <li
                key={g.id}
                className="flex items-center gap-3 p-4 border rounded cursor-pointer hover:bg-gray-50"
              >
                <span className="text-3xl">{g.icon}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{g.name}</span>
                  <span className="text-xs text-gray-400">{g.currency}</span>
                </div>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};

export default GroupsList;
