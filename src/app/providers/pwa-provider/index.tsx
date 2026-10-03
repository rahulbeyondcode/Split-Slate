import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";

import InstallDialog from "@/features/pwa/components/install-dialog";
import UpdateNotice from "@/features/pwa/components/update-notice";

import type { IconProgress } from "@/features/pwa/utils/icon-cache";

interface PropsType {
  children: ReactNode;
}

interface PwaState {
  progress: IconProgress | null;
  supported: boolean;
  repairIcons: () => void;
}

const PwaContext = createContext<PwaState>({
  progress: null,
  supported: false,
  repairIcons: () => undefined,
});

// The hook shares the provider's private context; it cannot live in a separate module.
// eslint-disable-next-line react-refresh/only-export-components
export const usePwa = () => useContext(PwaContext);

const PwaProvider = ({ children }: PropsType) => {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [progress, setProgress] = useState<IconProgress | null>(null);
  const applying = useRef(false);
  const supported = import.meta.env.PROD && "serviceWorker" in navigator;

  useEffect(() => {
    if (!supported) return;
    let mounted = true;
    let current: ServiceWorkerRegistration | null = null;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "ICON_PROGRESS") setProgress(event.data as IconProgress);
    };
    const onControllerChange = () => {
      if (applying.current) window.location.reload();
      else check();
    };
    const onUpdate = () => {
      if (current?.waiting && navigator.serviceWorker.controller) setUpdateAvailable(true);
    };
    const check = () => {
      onUpdate();
      if (!navigator.onLine) return;
      void current?.update().catch(() => undefined);
      current?.active?.postMessage({ type: "SYNC_ICONS" });
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") check();
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    window.addEventListener("online", check);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", onVisibility);
    const interval = window.setInterval(check, 60 * 60 * 1000);
    void navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}service-worker.js`, { scope: import.meta.env.BASE_URL })
      .then((worker) => {
        if (!mounted) return;
        current = worker;
        setRegistration(worker);
        onUpdate();
        worker.addEventListener("updatefound", () => {
          worker.installing?.addEventListener("statechange", onUpdate);
        });
        check();
        void navigator.storage?.persist?.().catch(() => undefined);
      })
      .catch(() => {
        if (mounted) {
          setProgress({
            type: "ICON_PROGRESS",
            state: "error",
            completed: 0,
            total: 0,
            message: "Offline setup is unavailable. Try reloading online.",
          });
        }
      });
    return () => {
      mounted = false;
      window.clearInterval(interval);
      navigator.serviceWorker.removeEventListener("message", onMessage);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.removeEventListener("online", check);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [supported]);

  const handleUpdate = () => {
    if (!registration?.waiting) return;
    applying.current = true;
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  };
  const repairIcons = () => {
    if (!navigator.onLine || !registration?.active) {
      setProgress({
        type: "ICON_PROGRESS",
        state: "error",
        completed: progress?.completed ?? 0,
        total: progress?.total ?? 0,
        message: !navigator.onLine
          ? "Connect to the internet, then try again. Saved icons are unchanged."
          : "Offline setup is not ready yet. Try again shortly.",
      });
      return;
    }
    setProgress({ type: "ICON_PROGRESS", state: "downloading", completed: 0, total: 0 });
    registration.active.postMessage({ type: "SYNC_ICONS" });
  };

  return (
    <PwaContext.Provider value={{ progress, supported, repairIcons }}>
      <InstallDialog supported={supported} />
      <UpdateNotice
        available={updateAvailable}
        onUpdate={handleUpdate}
        onLater={() => setUpdateAvailable(false)}
      />
      {children}
    </PwaContext.Provider>
  );
};

export default PwaProvider;
