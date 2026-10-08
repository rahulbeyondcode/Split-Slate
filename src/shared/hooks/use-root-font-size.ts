import { useLayoutEffect } from "react";

const REM_REFERENCE_PX = 16;
const ROOT_FONT_BASE_PX = REM_REFERENCE_PX;
const ROOT_FONT_MIN_PX = 14;
const BASELINE_VIEWPORT_WIDTH_PX = 400;
const MINIMUM_SCALE_VIEWPORT_WIDTH_PX = 360;

export const useRootFontSize = () => {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const previousScale = root.style.getPropertyValue("--app-font-scale");

    const updateFontSize = () => {
      const progress = Math.min(
        1,
        Math.max(
          0,
          (window.innerWidth - MINIMUM_SCALE_VIEWPORT_WIDTH_PX) /
            (BASELINE_VIEWPORT_WIDTH_PX - MINIMUM_SCALE_VIEWPORT_WIDTH_PX),
        ),
      );
      const fontSize = ROOT_FONT_MIN_PX + (ROOT_FONT_BASE_PX - ROOT_FONT_MIN_PX) * progress;
      root.style.setProperty("--app-font-scale", String(fontSize / REM_REFERENCE_PX));
    };

    updateFontSize();
    window.addEventListener("resize", updateFontSize);

    return () => {
      window.removeEventListener("resize", updateFontSize);
      if (previousScale) root.style.setProperty("--app-font-scale", previousScale);
      else root.style.removeProperty("--app-font-scale");
    };
  }, []);
};
