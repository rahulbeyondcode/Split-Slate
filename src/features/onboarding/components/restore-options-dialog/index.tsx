import { ArrowRight, FolderInput, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";

import DialogLayout from "@/shared/ui/dialog-layout";
import Icon from "@/shared/ui/icon";
import MobileEditorDialog from "@/shared/ui/mobile-editor-dialog";

interface PropsType {
  onCancel: () => void;
}

const RestoreOptionsDialog = ({ onCancel }: PropsType) => (
  <MobileEditorDialog title="Start with your saved data" onCancel={onCancel}>
    <DialogLayout
      title="Start with your saved data"
      onClose={onCancel}
      closeLabel="Close restore options"
      footer={
        <div className="grid w-full gap-3">
          <Link to="/import" className="intro-restore-option">
            <span className="intro-restore-icon" aria-hidden="true">
              <Icon icon={FolderInput} size={24} />
            </span>
            <span className="min-w-0">
              <span className="block font-bold">Import a group</span>
              <span className="mt-1 block text-sm leading-relaxed text-[var(--muted)]">
                Open a group someone shared or you saved.
              </span>
            </span>
            <Icon icon={ArrowRight} size={18} className="text-[var(--brand-ink)]" />
          </Link>
          <Link to="/restore" className="intro-restore-option">
            <span className="intro-restore-icon" aria-hidden="true">
              <Icon icon={RotateCcw} size={24} />
            </span>
            <span className="min-w-0">
              <span className="block font-bold">Restore your app</span>
              <span className="mt-1 block text-sm leading-relaxed text-[var(--muted)]">
                Bring everything back, just as you saved it.
              </span>
            </span>
            <Icon icon={ArrowRight} size={18} className="text-[var(--brand-ink)]" />
          </Link>
        </div>
      }
    />
  </MobileEditorDialog>
);

export default RestoreOptionsDialog;
