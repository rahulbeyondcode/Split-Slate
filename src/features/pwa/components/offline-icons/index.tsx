import { usePwa } from "@/app/providers/pwa-provider";
import StatusBanner from "@/shared/ui/status-banner";
import Surface from "@/shared/ui/surface";

const OfflineIcons = () => {
  const { supported, progress, repairIcons } = usePwa();
  if (!supported) return null;
  return (
    <section>
      <p className="eyebrow mb-2">Offline icons</p>
      <Surface className="surface-pad flex flex-col gap-3">
        <p className="soft-caption">
          Icons download while the app is open. Missing or changed files are fetched again without
          deleting your expenses or other saved icons.
        </p>
        <p role="status" aria-live="polite">
          {!progress && "Checking icon library…"}
          {progress?.state === "ready" && `${progress.total} icons ready offline`}
          {progress?.state === "downloading" &&
            (progress.total
              ? `Checking and downloading icons: ${progress.completed} / ${progress.total}`
              : "Checking icon library…")}
          {progress?.state === "error" && "Some icons are not ready offline yet."}
        </p>
        {progress?.state === "error" && (
          <StatusBanner variant="warning">{progress.message}</StatusBanner>
        )}
        <button type="button" className="btn btn-secondary self-start" onClick={repairIcons}>
          Check and repair icons
        </button>
        <p className="soft-caption">
          Browsers may clear offline files when storage is low. You can repair them when online.
        </p>
      </Surface>
    </section>
  );
};

export default OfflineIcons;
