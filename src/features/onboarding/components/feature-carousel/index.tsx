import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { slides } from "@/features/onboarding/components/feature-carousel/slide-data";

import AppLogo from "@/shared/ui/app-logo";

const FeatureCarousel = () => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const isFirst = current === 0;
  const isLast = current === slides.length - 1;
  const slide = slides[current];

  const handleNext = () => {
    if (isLast) {
      navigate("/onboarding/setup");
    } else {
      setCurrent((c) => c + 1);
    }
  };

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col px-6 py-7">
      <div className="flex items-center justify-between">
        <AppLogo />
        {!isLast && (
          <button className="soft-caption" onClick={() => navigate("/onboarding/setup")}>
            Skip
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
        <div className="hero !rounded-[52px] flex h-40 w-40 items-center justify-center !p-0 !text-6xl">
          {slide.icon}
        </div>
        <h1 className="page-title mt-5">{slide.title}</h1>
        <p className="muted text-sm leading-relaxed max-w-xs">{slide.description}</p>
      </div>

      <div className="flex justify-center gap-2 mb-6">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full ${i === current ? "w-5 bg-[var(--brand)]" : "w-2 bg-[var(--line)]"}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <button onClick={handleNext} className="btn btn-primary w-full !py-3">
          {isLast ? "Get started" : "Next"}
        </button>
        {!isFirst && (
          <button onClick={() => setCurrent((c) => c - 1)} className="btn btn-secondary">
            Previous
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => navigate("/import")}
        className="mt-3 text-xs text-[var(--brand-ink)]"
      >
        Import an existing group instead
      </button>
    </div>
  );
};

export default FeatureCarousel;
