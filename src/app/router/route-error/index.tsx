import { ArrowRight, House, RotateCw } from "lucide-react";
import { useEffect } from "react";
import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";

import Icon from "@/shared/ui/icon";

const RouteError = () => {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  useEffect(() => {
    document.documentElement.dataset.theme =
      localStorage.getItem("split-slate-theme") === "dark" ? "dark" : "light";
  }, []);

  const handleRetry = () => window.location.reload();

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="surface w-full max-w-lg p-7 text-center sm:p-10">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--brand-soft)]">
          <img
            src={
              notFound
                ? "/emoji-icons/objects/magnifying-glass-tilted-right-3d.png"
                : "/emoji-icons/objects/hammer-and-wrench-3d.png"
            }
            alt={notFound ? "Magnifying glass" : "Hammer and wrench"}
            className="h-14 w-14 object-contain"
          />
        </div>
        <p className="eyebrow mb-3">{notFound ? "PAGE NOT FOUND" : "SOMETHING WENT WRONG"}</p>
        <h1 className="page-title">{notFound ? "We couldn't find that page" : "We hit a snag"}</h1>
        <p className="mt-3 leading-6 text-[var(--muted)]">
          {notFound
            ? "That link may be out of date. You can head back to SplitSlate and keep going."
            : "Sorry, this page couldn't load. Try again, or head back to SplitSlate."}
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link to="/" className="btn btn-primary">
            <Icon icon={House} size={16} /> Go to home <Icon icon={ArrowRight} size={16} />
          </Link>
          {!notFound && (
            <button type="button" className="btn btn-secondary" onClick={handleRetry}>
              <Icon icon={RotateCw} size={16} /> Try again
            </button>
          )}
        </div>
      </div>
    </main>
  );
};

export default RouteError;
