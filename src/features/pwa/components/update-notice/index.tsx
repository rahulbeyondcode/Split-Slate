interface PropsType {
  available: boolean;
  onUpdate: () => void;
  onLater: () => void;
}

const UpdateNotice = ({ available, onUpdate, onLater }: PropsType) => {
  if (!available) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-4 z-50 mx-auto max-w-md rounded-xl bg-[var(--surface)] p-4 text-[var(--ink)] shadow-xl"
    >
      <strong>Split Slate update available</strong>
      <p className="my-2">
        Finish any unsaved changes, then update. Your local data stays on this device.
      </p>
      <div className="flex gap-2">
        <button type="button" className="btn btn-primary" onClick={onUpdate}>
          Update and reload
        </button>
        <button type="button" className="btn btn-secondary" onClick={onLater}>
          Later
        </button>
      </div>
    </div>
  );
};

export default UpdateNotice;
