import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { slides } from "@/features/onboarding/components/feature-carousel/slide-data";

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
    <div className="flex flex-col h-svh p-6 max-w-md mx-auto">
      <div className="flex justify-end h-8">
        {!isLast && (
          <button className="text-sm text-gray-500" onClick={() => navigate("/onboarding/setup")}>
            Skip
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
        <div className="text-6xl">{slide.icon}</div>
        <h2 className="text-2xl font-bold">{slide.title}</h2>
        <p className="text-gray-600 text-base leading-relaxed max-w-xs">{slide.description}</p>
      </div>

      <div className="flex justify-center gap-2 mb-6">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full ${i === current ? "bg-gray-900" : "bg-gray-300"}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrent((c) => c - 1)}
          disabled={isFirst}
          className="px-4 py-2 text-sm disabled:opacity-30"
        >
          Previous
        </button>
        <button onClick={handleNext} className="px-6 py-2 bg-gray-900 text-white text-sm rounded">
          {isLast ? "Get Started" : "Next"}
        </button>
      </div>
    </div>
  );
};

export default FeatureCarousel;
