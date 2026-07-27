import { useEffect, useState } from "react";

export interface CountdownValue {
  d: string;
  h: string;
  m: string;
  s: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function useCountdown(target: Date): CountdownValue {
  const [value, setValue] = useState<CountdownValue>({ d: "00", h: "00", m: "00", s: "00" });

  useEffect(() => {
    const targetMs = target.getTime();
    const tick = () => {
      const diff = Math.max(0, targetMs - Date.now());
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setValue({ d: pad(d), h: pad(h), m: pad(m), s: pad(s) });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [target]);

  return value;
}
