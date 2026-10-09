import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useLayoutEffect, useRef } from "react";

import Icon from "@/shared/ui/icon";

interface PropsType {
  title: string;
  titleId?: string;
  children?: ReactNode;
  footer?: ReactNode;
  icon?: ReactNode;
  onClose: () => void;
  closeLabel?: string;
  closeDisabled?: boolean;
  bodyClassName?: string;
  bodyLabel?: string;
}

const DialogLayout = ({
  title,
  titleId,
  children,
  footer,
  icon,
  onClose,
  closeLabel = "Close dialog",
  closeDisabled = false,
  bodyClassName = "",
  bodyLabel,
}: PropsType) => {
  const layoutRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const dialog = layoutRef.current?.closest("dialog");
    const viewport = window.visualViewport;
    if (!dialog || !viewport) return;
    const updateViewport = () => {
      dialog.style.setProperty("--dialog-viewport-height", `${viewport.height}px`);
      dialog.style.setProperty("--dialog-viewport-width", `${viewport.width}px`);
      dialog.style.setProperty("--dialog-viewport-top", `${viewport.offsetTop}px`);
      dialog.style.setProperty("--dialog-viewport-left", `${viewport.offsetLeft}px`);
    };
    updateViewport();
    viewport.addEventListener("resize", updateViewport);
    viewport.addEventListener("scroll", updateViewport);
    return () => {
      viewport.removeEventListener("resize", updateViewport);
      viewport.removeEventListener("scroll", updateViewport);
      for (const property of ["height", "width", "top", "left"]) {
        dialog.style.removeProperty(`--dialog-viewport-${property}`);
      }
    };
  }, []);

  return (
    <div ref={layoutRef} className="dialog-layout">
      <header className="dialog-header">
        <div className="flex min-w-0 items-center gap-3">
          {icon && (
            <span className="shrink-0" aria-hidden="true">
              {icon}
            </span>
          )}
          <h2 id={titleId} className="section-title min-w-0 break-words">
            {title}
          </h2>
        </div>
        <button
          type="button"
          aria-label={closeLabel}
          disabled={closeDisabled}
          onClick={onClose}
          className="btn btn-secondary shrink-0 !p-2"
        >
          <Icon icon={X} size={18} />
        </button>
      </header>
      {children != null && (
        <div
          role={bodyLabel ? "group" : undefined}
          aria-label={bodyLabel}
          className={`dialog-body ${bodyClassName}`}
        >
          {children}
        </div>
      )}
      {footer && <footer className="dialog-footer">{footer}</footer>}
    </div>
  );
};

export default DialogLayout;
