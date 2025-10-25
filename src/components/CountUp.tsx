'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type CountUpProps = {
  value: number;
  durationMs?: number;
  prefix?: string;
  suffix?: string;
  startOnVisible?: boolean;
};

export default function CountUp({ value, durationMs = 1200, prefix = '', suffix = '', startOnVisible = true }: CountUpProps) {
  const [current, setCurrent] = useState(0);
  const startedRef = useRef(false);
  const hostRef = useRef<HTMLSpanElement | null>(null);

  const formatter = useMemo(() => new Intl.NumberFormat('en-US'), []);

  useEffect(() => {
    let raf = 0;
    let startTime = 0;

    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const t = Math.min(1, elapsed / durationMs);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setCurrent(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(animate);
    };

    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      raf = requestAnimationFrame(animate);
    };

    if (!startOnVisible) {
      start();
      return () => cancelAnimationFrame(raf);
    }

    const el = hostRef.current;
    if (!el) {
      start();
      return () => cancelAnimationFrame(raf);
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) start();
      });
    }, { threshold: 0.3 });
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, durationMs, startOnVisible]);

  return (
    <span ref={hostRef}>
      {prefix}{formatter.format(current)}{suffix}
    </span>
  );
}


