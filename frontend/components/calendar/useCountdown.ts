"use client";

import { useEffect, useState } from "react";

export function useCountdown(deadline: string | null) {
  const [remaining, setRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    if (!deadline) return;

    let active = true;

    function tick() {
      if (!active) return;
      const end = new Date(deadline!).getTime();
      const diff = end - Date.now();

      if (diff <= 0) {
        setRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
        return;
      }

      setRemaining({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        total: diff,
      });

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
    return () => { active = false; };
  }, [deadline]);

  return remaining;
}
