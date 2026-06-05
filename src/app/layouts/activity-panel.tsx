const ActivityPanel = () => {
  return (
    <aside className="w-[20%] h-full shrink-0 flex flex-col border-l border-gray-200 bg-white">
      <div className="px-5 py-4 border-b border-gray-100">
        <span className="text-sm font-medium text-gray-700">Activity</span>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-xs text-gray-400">No activity yet</p>
      </div>
    </aside>
  );
};

export default ActivityPanel;
