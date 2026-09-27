import { useEffect, useState } from "react";

const ORBIT_NOTES = [
  "Shared expenses",
  "Clear balances",
  "Easy group splits",
  "Everyone pays fairly",
  "Who owes whom",
  "Track every expense",
  "Multiple payers",
  "Flexible splits",
  "Your data, your device",
  "Friends and family",
  "One clear history",
  "Keep tabs together",
  "No accounts needed",
  "Spend, then split",
] as const;

export const useOrbitNotes = () => {
  const [notes, setNotes] = useState<[string, string]>([ORBIT_NOTES[0], ORBIT_NOTES[1]]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: number;

    const scheduleNext = () => {
      timer = window.setTimeout(
        () => {
          setNotes(([top, bottom]) => {
            const choices = ORBIT_NOTES.filter((note) => note !== top && note !== bottom);
            const nextTop = choices[Math.floor(Math.random() * choices.length)];
            const remaining = choices.filter((note) => note !== nextTop);
            const nextBottom = remaining[Math.floor(Math.random() * remaining.length)];
            return [nextTop, nextBottom];
          });
          scheduleNext();
        },
        3000 + Math.random() * 2000,
      );
    };

    const handleMotionPreference = () => {
      window.clearTimeout(timer);
      if (!reducedMotion.matches) scheduleNext();
    };

    handleMotionPreference();
    reducedMotion.addEventListener("change", handleMotionPreference);
    return () => {
      window.clearTimeout(timer);
      reducedMotion.removeEventListener("change", handleMotionPreference);
    };
  }, []);

  return notes;
};
