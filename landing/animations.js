(() => {
  "use strict";

  const root = document.documentElement;
  const motionButton = document.querySelector(".motion-toggle");
  const motionLabel = document.querySelector(".motion-label");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const desktopStory = window.matchMedia("(min-width: 56.001rem) and (min-height: 42rem)");
  const story = document.querySelector(".story-section");
  const chapters = [...document.querySelectorAll("[data-chapter]")];
  const heroScene = document.querySelector(".hero-scene");
  const sceneParallax = document.querySelector(".scene-parallax");
  const progressBar = document.querySelector(".reading-progress");
  const revealAnimations = new Set();
  let manuallyPaused = false;
  let frame = 0;
  let demoFrame = 0;
  let heroVisible = false;
  let pointerX = 0;
  let pointerY = 0;

  const motionOff = () => manuallyPaused || reducedMotion.matches;
  const canAnimate = () => !motionOff() && !document.hidden;
  const currency = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  const SPLIT_EXAMPLES = {
    equal: {
      amounts: [400, 400, 400],
      explanation: "Three people. Three equal shares.",
      label: "Equal split",
    },
    unequal: {
      amounts: [600, 400, 200],
      explanation: "Exact amounts: you ₹600, Maya ₹400, Dev ₹200.",
      label: "Unequal split",
    },
    shares: {
      amounts: [600, 300, 300],
      explanation: "Two shares for you. One each for Maya and Dev.",
      label: "Shares split, in a 2 to 1 to 1 ratio",
    },
    percentage: {
      amounts: [600, 360, 240],
      explanation: "Your share: 50%. Maya’s: 30%. Dev’s: 20%.",
      label: "Percentage split, 50 percent, 30 percent, 20 percent",
    },
    adjust: {
      amounts: [500, 400, 300],
      explanation: "Start equal. Add ₹100 to yours, take ₹100 off Dev’s.",
      label: "Adjusted equal split",
    },
  };

  const allocations = [...document.querySelectorAll(".allocation")];
  const amountLabels = [...document.querySelectorAll("[data-amount]")];
  const splitButtons = [...document.querySelectorAll("[data-split]")];
  const explanation = document.querySelector(".demo-explanation");
  const demoStatus = document.querySelector("#demo-status");
  let displayedAmounts = [400, 400, 400];
  let selectedExample = SPLIT_EXAMPLES.equal;

  const renderAmounts = (amounts) => {
    displayedAmounts = [...amounts];
    allocations.forEach((allocation, index) => {
      allocation.style.setProperty("--share", String(amounts[index] / 1200));
      amountLabels[index].textContent = currency.format(amounts[index]);
    });
  };

  const finishDemo = () => {
    window.cancelAnimationFrame(demoFrame);
    demoFrame = 0;
    renderAmounts(selectedExample.amounts);
  };

  const animateAmounts = (target) => {
    window.cancelAnimationFrame(demoFrame);
    const startAmounts = [...displayedAmounts];
    const started = performance.now();

    if (!canAnimate()) {
      finishDemo();
      return;
    }

    const tick = (now) => {
      if (!canAnimate()) {
        finishDemo();
        return;
      }

      const progress = Math.min((now - started) / 700, 1);
      const eased = 1 - (1 - progress) ** 3;
      const first = Math.round(startAmounts[0] + (target[0] - startAmounts[0]) * eased);
      const second = Math.round(startAmounts[1] + (target[1] - startAmounts[1]) * eased);
      // Keep the displayed total exact, including every intermediate animation frame.
      renderAmounts([first, second, 1200 - first - second]);

      if (progress < 1) {
        demoFrame = window.requestAnimationFrame(tick);
      } else {
        demoFrame = 0;
        renderAmounts(target);
      }
    };

    demoFrame = window.requestAnimationFrame(tick);
  };

  const handleSplit = (event) => {
    const button = event.currentTarget;
    const example = SPLIT_EXAMPLES[button.dataset.split];
    if (!example) return;

    selectedExample = example;
    splitButtons.forEach((control) => {
      control.setAttribute("aria-pressed", String(control === button));
    });
    explanation.textContent = example.explanation;
    demoStatus.textContent = `${example.label}. You ${currency.format(example.amounts[0])}, Maya ${currency.format(example.amounts[1])}, Dev ${currency.format(example.amounts[2])}. Total ${currency.format(1200)}.`;
    animateAmounts(example.amounts);
  };

  const renderPage = () => {
    frame = 0;
    if (document.hidden) return;

    const scrollable = Math.max(root.scrollHeight - window.innerHeight, 1);
    const readingProgress = Math.min(Math.max(window.scrollY / scrollable, 0), 1);
    progressBar.style.transform = `scaleX(${readingProgress})`;

    if (desktopStory.matches) {
      const trigger = window.innerHeight * 0.56;
      let stage = "1";
      chapters.forEach((chapter) => {
        if (chapter.getBoundingClientRect().top <= trigger) stage = chapter.dataset.chapter;
      });
      story.dataset.stage = stage;
    } else {
      story.dataset.stage = "3";
    }

    if (heroVisible && canAnimate() && finePointer.matches) {
      const heroTop = heroScene.getBoundingClientRect().top;
      const shift = Math.max(-18, Math.min(18, (80 - heroTop) * 0.055));
      sceneParallax.style.setProperty("--scene-shift", `${shift.toFixed(2)}px`);
      sceneParallax.style.setProperty("--tilt-x", `${(-pointerY * 4).toFixed(2)}deg`);
      sceneParallax.style.setProperty("--tilt-y", `${(pointerX * 5).toFixed(2)}deg`);
    } else {
      sceneParallax.style.setProperty("--scene-shift", "0px");
      sceneParallax.style.setProperty("--tilt-x", "0deg");
      sceneParallax.style.setProperty("--tilt-y", "0deg");
    }
  };

  const scheduleRender = () => {
    if (!frame && !document.hidden) frame = window.requestAnimationFrame(renderPage);
  };

  const applyStoryLayout = () => {
    story.classList.toggle("story-enhanced", desktopStory.matches);
    scheduleRender();
  };

  const applyMotion = () => {
    const off = motionOff();
    root.dataset.motion = off ? "off" : "on";
    motionButton.setAttribute("aria-pressed", String(off));
    motionButton.disabled = reducedMotion.matches;
    motionLabel.textContent = reducedMotion.matches
      ? "Motion reduced"
      : off
        ? "Motion off"
        : "Motion on";
    motionButton.setAttribute(
      "aria-label",
      reducedMotion.matches
        ? "Animations reduced to match your device preference"
        : off
          ? "Resume animations"
          : "Pause animations",
    );

    if (off) {
      revealAnimations.forEach((animation) => animation.cancel());
      revealAnimations.clear();
      finishDemo();
    }
    scheduleRender();
  };

  const handleMotionToggle = () => {
    manuallyPaused = !manuallyPaused;
    applyMotion();
  };

  const handlePointerMove = (event) => {
    if (!finePointer.matches || !canAnimate()) return;
    const bounds = heroScene.getBoundingClientRect();
    pointerX = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2));
    pointerY = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2));
    scheduleRender();
  };

  const handlePointerLeave = () => {
    pointerX = 0;
    pointerY = 0;
    scheduleRender();
  };

  const handleVisibility = () => {
    root.classList.toggle("is-page-hidden", document.hidden);
    if (document.hidden) {
      window.cancelAnimationFrame(frame);
      frame = 0;
      finishDemo();
      revealAnimations.forEach((animation) => animation.finish());
      revealAnimations.clear();
    } else {
      scheduleRender();
    }
  };

  const observeScenes = () => {
    const scenes = [...document.querySelectorAll("[data-scene]")];
    if (!("IntersectionObserver" in window)) {
      scenes.forEach((scene) => scene.classList.add("is-in-view"));
      heroScene.classList.add("has-entered");
      heroVisible = true;
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("is-in-view", entry.isIntersecting);
          if (entry.isIntersecting) entry.target.classList.add("has-entered");
          if (entry.target === heroScene) {
            heroVisible = entry.isIntersecting;
            scheduleRender();
          }
        });
      },
      { threshold: 0.05 },
    );
    scenes.forEach((scene) => observer.observe(scene));
  };

  const observeReveals = () => {
    if (!("IntersectionObserver" in window) || !("animate" in Element.prototype)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          if (!canAnimate()) return;

          const delay = Number(entry.target.dataset.delay || 0);
          const animation = entry.target.animate(
            [
              { opacity: 0, transform: "translateY(24px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            {
              duration: 800,
              delay,
              easing: "cubic-bezier(0.16, 1, 0.3, 1)",
              fill: "backwards",
            },
          );
          revealAnimations.add(animation);
          animation.onfinish = () => revealAnimations.delete(animation);
          animation.oncancel = () => revealAnimations.delete(animation);
        });
      },
      { threshold: 0.12 },
    );
    document.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));
  };

  const enhanceQuestions = () => {
    if (!("animate" in Element.prototype)) return;
    document.querySelectorAll(".faq-list details").forEach((details) => {
      let animation = null;
      details.addEventListener("toggle", () => {
        if (animation) animation.cancel();
        if (!details.open || !canAnimate()) return;
        const answer = details.querySelector(".faq-answer");
        animation = answer.animate(
          [
            { opacity: 0, transform: "translateY(-8px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 300, easing: "ease-out" },
        );
        revealAnimations.add(animation);
        const current = animation;
        current.onfinish = () => revealAnimations.delete(current);
        current.oncancel = () => revealAnimations.delete(current);
      });
    });
  };

  splitButtons.forEach((button) => {
    button.disabled = false;
    button.addEventListener("click", handleSplit);
  });
  document.querySelector(".demo-disclaimer").textContent =
    "Illustrative demo only. No expenses are saved here.";
  motionButton.hidden = false;
  motionButton.addEventListener("click", handleMotionToggle);
  heroScene.addEventListener("pointermove", handlePointerMove);
  heroScene.addEventListener("pointerleave", handlePointerLeave);
  window.addEventListener("scroll", scheduleRender, { passive: true });
  window.addEventListener("resize", scheduleRender, { passive: true });
  document.addEventListener("visibilitychange", handleVisibility);
  reducedMotion.addEventListener("change", applyMotion);
  finePointer.addEventListener("change", handlePointerLeave);
  desktopStory.addEventListener("change", applyStoryLayout);
  applyMotion();
  applyStoryLayout();
  handleVisibility();
  observeScenes();
  observeReveals();
  enhanceQuestions();
})();
