import type { ReactNode, SyntheticEvent } from "react";
import { useEffect, useRef } from "react";

interface PropsType {
  title: string;
  children: ReactNode;
  onCancel: () => void;
  busy?: boolean;
}

const MobileEditorDialog = ({ title, children, onCancel, busy = false }: PropsType) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const initialField = dialog.querySelector<HTMLElement>(
      "input:not([type='hidden']):not(:disabled), select:not(:disabled), textarea:not(:disabled)",
    );
    initialField?.focus({ preventScroll: true });
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    if (busy) event.preventDefault();
    else onCancel();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      onCancel={handleCancel}
      className="app-dialog max-w-lg rounded-3xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-2xl backdrop:bg-black/60"
    >
      {children}
    </dialog>
  );
};

export default MobileEditorDialog;
