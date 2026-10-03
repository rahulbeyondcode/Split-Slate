import { Download, X } from "lucide-react";
import type { SyntheticEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";

import Icon from "@/shared/ui/icon";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PropsType {
  supported: boolean;
}

const DISMISSED_KEY = "split-slate-install-dismissed";

const isInstalled = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const InstallDialog = ({ supported }: PropsType) => {
  const [visible, setVisible] = useState(
    () => supported && !isInstalled() && localStorage.getItem(DISMISSED_KEY) !== "true",
  );
  const [canDismiss, setCanDismiss] = useState(false);
  const [instructions, setInstructions] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const agent = navigator.userAgent;
  const isAppleMobile =
    /iPhone|iPad|iPod/i.test(agent) ||
    (agent.includes("Macintosh") && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(agent);

  useEffect(() => {
    if (!visible) return;
    const dialog = dialogRef.current;
    if (!dialog?.open) dialog?.showModal();
    const timeout = window.setTimeout(() => setCanDismiss(true), 2000);
    return () => window.clearTimeout(timeout);
  }, [visible]);

  useEffect(() => {
    if (!supported || !visible) return;
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      localStorage.setItem(DISMISSED_KEY, "true");
      setVisible(false);
      dialogRef.current?.close();
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [supported, visible]);

  const handleDismiss = () => {
    if (!canDismiss) return;
    localStorage.setItem(DISMISSED_KEY, "true");
    setVisible(false);
    dialogRef.current?.close();
  };
  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    handleDismiss();
  };
  const handleInstall = async () => {
    if (!installPrompt) {
      setInstructions(true);
      return;
    }
    setInstallPrompt(null);
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") {
        localStorage.setItem(DISMISSED_KEY, "true");
        setVisible(false);
        dialogRef.current?.close();
      } else {
        setInstructions(true);
      }
    } catch {
      setInstructions(true);
    }
  };

  if (!visible) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={handleCancel}
      className="m-auto max-h-[calc(100svh-32px)] w-[calc(100%-32px)] max-w-md overflow-y-auto rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 text-[var(--ink)] shadow-2xl backdrop:bg-black/60"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-ink)]">
          <Icon icon={Download} size={26} />
        </span>
        <button
          type="button"
          aria-label="Close install message"
          disabled={!canDismiss}
          onClick={handleDismiss}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-soft)]"
        >
          <Icon icon={X} size={20} />
        </button>
      </div>
      <h2 id={titleId} className="mt-4 text-xl font-bold">
        Take Split Slate with you
      </h2>
      <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
        Install Split Slate for quick access and offline use. It opens like an app, with no app
        store needed.
      </p>
      {instructions && (
        <p role="status" className="note mt-4 leading-relaxed">
          {isAppleMobile
            ? "Open your browser’s Share menu, then choose Add to Home Screen. If that option is missing, open this page in Safari and use Share → Add to Home Screen."
            : isAndroid
              ? "Open your browser’s menu (⋮), then choose Install app or Add to Home screen."
              : "Open your browser’s menu or the install icon in the address bar, then choose Install Split Slate."}
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          disabled={!canDismiss}
          onClick={handleDismiss}
          className="btn btn-secondary"
        >
          Cancel
        </button>
        <button
          type="button"
          autoFocus
          onClick={() => void handleInstall()}
          className="btn btn-primary"
        >
          Install
        </button>
      </div>
    </dialog>
  );
};

export default InstallDialog;
