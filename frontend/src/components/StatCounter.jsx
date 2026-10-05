import { useEffect, useRef, useState } from "react";

/**
 * Counts up from 0 to `value` once it scrolls into view. Pure visual
 * polish for the landing page — falls back gracefully (shows the final
 * number immediately) if IntersectionObserver isn't available.
 */
export default function StatCounter({ value, suffix = "", label, duration = 1200 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setCount(value);
      return;
    }

    const node = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            setCount(Math.round(value * (1 - Math.pow(1 - progress, 3)))); // ease-out
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );

    if (node) observer.observe(node);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <div ref={ref} className="flex flex-col items-center text-center">
      <span className="font-display text-3xl font-extrabold text-white sm:text-4xl">
        {count.toLocaleString()}
        {suffix}
      </span>
      <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-primary-100 sm:text-sm">
        {label}
      </span>
    </div>
  );
}
