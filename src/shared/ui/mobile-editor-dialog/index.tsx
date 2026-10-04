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
    dialogRef.current?.showModal();
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
      className="m-auto max-h-[90svh] w-[calc(100%-32px)] max-w-lg overflow-y-auto rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-4 text-[var(--ink)] shadow-2xl backdrop:bg-black/60"
    >
      {children}
    </dialog>
  );
};

export default MobileEditorDialog;
