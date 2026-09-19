import { useRef, useState } from "react";

import { clearDatabase, createDevItem, onboardUser } from "@/features/dev-tools/store";
import type { DevDataType } from "@/features/dev-tools/utils/random-data";
import { useStore } from "@/shared/configs/store";

const CREATION_ACTIONS: { type: DevDataType; label: string; needsGroup: boolean }[] = [
  { type: "person", label: "Add person", needsGroup: false },
  { type: "group", label: "Add group", needsGroup: false },
  { type: "member", label: "Add member", needsGroup: true },
  { type: "category", label: "Add category", needsGroup: true },
  { type: "tag", label: "Add tag", needsGroup: true },
  { type: "expense", label: "Add expense", needsGroup: true },
];

const RESET_ACTIONS = [
  { label: "Onboard user", run: onboardUser },
  { label: "Clear database", run: clearDatabase },
] as const;

const ACTION_CLASS_NAME =
  "rounded bg-amber-900 px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50";

const DevTools = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const actionInFlight = useRef(false);
  const groups = useStore((state) => state.groups);
  const initialized = useStore((state) => state.initialized);
  const onboardingComplete = useStore((state) => state.onboardingComplete);
  const localUser = useStore((state) => state.localUser);
  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? groups[0];
  const canCreate = initialized && onboardingComplete && localUser !== null;

  const handleAction = async (label: string, action: () => Promise<void>) => {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    setPendingAction(label);
    setError(null);
    setMessage(null);
    try {
      await action();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Development action failed");
    } finally {
      actionInFlight.current = false;
      setPendingAction(null);
    }
  };

  const handleCreate = (type: DevDataType, label: string) =>
    handleAction(label, async () => {
      const result = await createDevItem(type, selectedGroup?.id);
      if (result.groupId) setSelectedGroupId(result.groupId);
      setMessage(result.message);
    });

  const handleReset = (label: string, action: () => Promise<void>) =>
    handleAction(label, async () => {
      await action();
      window.location.reload();
    });

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    setError(null);
    setMessage(null);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed top-2 right-2 z-50 rounded bg-amber-900 px-3 py-1.5 text-xs font-bold text-white shadow-md"
      >
        Dev tools
      </button>
    );
  }

  return (
    <div
      role="region"
      aria-label="Development tools"
      className="fixed top-2 right-2 z-50 max-h-[calc(100dvh-1rem)] w-80 max-w-[calc(100vw-1rem)] overflow-y-auto rounded border border-amber-300 bg-amber-100 p-3 text-amber-950 shadow-md"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide">Dev tools</span>
        <button
          type="button"
          aria-label="Close development tools"
          onClick={() => setIsOpen(false)}
          className="grid size-6 place-items-center rounded text-base leading-none hover:bg-amber-200"
        >
          x
        </button>
      </div>
      {!canCreate && <p className="mb-3 text-xs">Complete onboarding to add individual items.</p>}
      {groups.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-semibold">Target group: {selectedGroup?.name}</p>
          <div
            role="group"
            aria-label="Target group"
            className="flex max-h-28 flex-wrap gap-1 overflow-y-auto"
          >
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                aria-pressed={selectedGroup?.id === group.id}
                disabled={pendingAction !== null}
                onClick={() => handleSelectGroup(group.id)}
                className="rounded border border-amber-400 px-2 py-1 text-xs aria-pressed:bg-amber-900 aria-pressed:text-white disabled:opacity-50"
              >
                {group.icon} {group.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {CREATION_ACTIONS.map(({ type, label, needsGroup }) => (
          <button
            key={type}
            type="button"
            disabled={pendingAction !== null || !canCreate || (needsGroup && !selectedGroup)}
            onClick={() => handleCreate(type, label)}
            className={ACTION_CLASS_NAME}
          >
            {pendingAction === label ? "Working…" : label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs">
        Members use the people directory. Expenses use a matching category, creating one if needed.
      </p>
      {message && (
        <p role="status" className="mt-2 text-xs text-green-800">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {error}
        </p>
      )}
      <div className="mt-3 border-t border-amber-300 pt-3">
        <p className="mb-2 text-xs">Database reset actions replace or clear all local data.</p>
        <div className="flex flex-wrap gap-2">
          {RESET_ACTIONS.map(({ label, run }) => (
            <button
              key={label}
              type="button"
              disabled={pendingAction !== null}
              onClick={() => handleReset(label, run)}
              className={ACTION_CLASS_NAME}
            >
              {pendingAction === label ? "Working…" : label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DevTools;
