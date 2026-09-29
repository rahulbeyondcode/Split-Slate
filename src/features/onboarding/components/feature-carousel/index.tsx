import { ArrowRight, ArrowUpRight, Check, LockKeyhole, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { slides } from "@/features/onboarding/components/feature-carousel/slide-data";

import { useOrbitNotes } from "@/features/onboarding/hooks/use-orbit-notes";

import EmojiImage from "@/shared/ui/emoji-image";
import Icon from "@/shared/ui/icon";

const FeatureCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [loadedAnimation, setLoadedAnimation] = useState<string | null>(null);
  const notes = useOrbitNotes();
  const navigate = useNavigate();

  useEffect(() => {
    slides.forEach(({ animatedIcon }) => {
      const image = new Image();
      image.src = animatedIcon;
    });
  }, []);

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
  const handlePrevious = () => setCurrent((index) => index - 1);
  const handleSkip = () => navigate("/onboarding/setup");
  const handleImport = () => navigate("/import");

  return (
    <main className="intro-layout">
      <section className="intro-visual" aria-label="Welcome to SplitSlate">
        <div className="intro-topbar">
          <div className="intro-brand">
            <span className="intro-brand-mark" aria-hidden="true" />
            <span>SplitSlate</span>
          </div>
          {!isLast && (
            <button type="button" onClick={handleSkip} className="intro-skip">
              Skip intro <Icon icon={ArrowUpRight} size={17} />
            </button>
          )}
        </div>

        <div className="intro-visual-content">
          <div className="intro-orbit" aria-hidden="true">
            <span
              className={`intro-orbit-icon ${loadedAnimation === slide.animatedIcon ? "is-animated" : ""}`}
              key={current}
            >
              <span className="intro-orbit-static">
                <EmojiImage icon={slide.icon} />
              </span>
              <img
                className="intro-orbit-animation"
                src={slide.animatedIcon}
                alt=""
                onLoad={() => setLoadedAnimation(slide.animatedIcon)}
              />
            </span>
            <span className="intro-orbit-note intro-orbit-note-top inline-flex items-center gap-1">
              <Icon icon={Sparkles} size={16} /> {notes[0]}
            </span>
            <span className="intro-orbit-note intro-orbit-note-bottom inline-flex items-center gap-1">
              <Icon icon={Check} size={16} /> {notes[1]}
            </span>
          </div>
          <div className="intro-visual-copy">
            <p className="intro-visual-eyebrow">THE WAY FRIENDS SPLIT</p>
            <h2>Good times. Clear tabs.</h2>
            <p>Keep the memories, not the mental maths. Every shared expense in one calm place.</p>
          </div>
        </div>

        <p className="intro-visual-footnote inline-flex items-center gap-2">
          <Icon icon={LockKeyhole} size={16} /> No accounts · no cloud · works offline
        </p>
      </section>

      <section className="intro-panel" aria-label="Introduction">
        <div className="intro-slide" key={current}>
          <p className="eyebrow">Discover SplitSlate · {String(current + 1).padStart(2, "0")}</p>
          <h1>{slide.title}</h1>
          <p className="intro-description">{slide.description}</p>
        </div>

        <div className="intro-footer">
          <div className="intro-progress" aria-label="Introduction slides">
            {slides.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => setCurrent(index)}
                aria-label={`Go to slide ${index + 1}: ${item.title}`}
                aria-current={index === current ? "step" : undefined}
                className={index === current ? "intro-dot is-current" : "intro-dot"}
              />
            ))}
          </div>
          <div className="intro-actions">
            {!isFirst && (
              <button type="button" onClick={handlePrevious} className="btn btn-secondary">
                Previous
              </button>
            )}
            <button type="button" onClick={handleNext} className="btn btn-primary intro-next">
              {isLast ? "Get started" : "Next"}
            </button>
          </div>
          <button type="button" onClick={handleImport} className="intro-import">
            Already have a group?{" "}
            <span>
              Import it instead <Icon icon={ArrowRight} size={16} />
            </span>
          </button>
          <Link to="/restore" className="intro-import">
            Have a whole-app backup? <span>Restore everything</span>
          </Link>
        </div>
      </section>
    </main>
  );
};

export default FeatureCarousel;
