import { TriangleAlert } from "lucide-react";
import type { ReactNode, SyntheticEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";

import DialogLayout from "@/shared/ui/dialog-layout";
import Icon from "@/shared/ui/icon";

interface PropsType {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  pendingLabel?: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

const ConfirmationDialog = ({
  open,
  title,
  description,
  confirmLabel,
  pendingLabel = "Deleting…",
  onCancel,
  onConfirm,
}: PropsType) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog?.open) {
      setError(null);
      dialog?.showModal();
    } else if (!open && dialog?.open) {
      dialog.close();
    }
  }, [open]);

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    if (submittingRef.current) {
      event.preventDefault();
      return;
    }
    onCancel();
  };
  const handleClose = () => {
    if (open) onCancel();
  };

  const handleConfirm = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not complete this action");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={handleCancel}
      onClose={handleClose}
      className="app-dialog max-w-md rounded-3xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-2xl backdrop:bg-black/60"
    >
      <DialogLayout
        title={title}
        titleId={titleId}
        onClose={onCancel}
        closeDisabled={submitting}
        icon={<Icon icon={TriangleAlert} size={26} className="text-[var(--negative)]" />}
        footer={
          <>
            <button
              type="button"
              autoFocus
              disabled={submitting}
              onClick={onCancel}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleConfirm()}
              className="btn btn-danger"
            >
              {submitting ? pendingLabel : confirmLabel}
            </button>
          </>
        }
      >
        <p id={descriptionId} className="text-sm leading-relaxed text-[var(--muted)]">
          {description}
        </p>
        {error && (
          <p role="alert" className="mt-4 text-sm money-negative">
            {error}
          </p>
        )}
      </DialogLayout>
    </dialog>
  );
};

export default ConfirmationDialog;
