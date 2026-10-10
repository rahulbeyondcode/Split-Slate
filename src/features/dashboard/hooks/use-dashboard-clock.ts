import { useEffect, useState } from "react";

const MINUTE_MS = 60_000;

export const useDashboardClock = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: number | undefined;

    const scheduleUpdate = () => {
      if (!document.hidden) {
        timer = window.setTimeout(update, MINUTE_MS - (Date.now() % MINUTE_MS));
      }
    };

    const update = () => {
      window.clearTimeout(timer);
      setNow(new Date());
      scheduleUpdate();
    };

    scheduleUpdate();
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  const minutes = now.getHours() * 60 + now.getMinutes();
  const isLateNight = minutes >= 21 * 60 + 30 || minutes < 4 * 60 + 30;
  const greeting = isLateNight
    ? "Hello"
    : minutes < 12 * 60
      ? "Good morning"
      : minutes < 17 * 60
        ? "Good afternoon"
        : "Good evening";

  return { now, greeting, isLateNight };
};
