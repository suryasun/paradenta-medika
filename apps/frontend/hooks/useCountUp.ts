import { useEffect, useState } from "react";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

// docs/02-design/design-system.md §11.7: KPI/stat values get a brief
// count-up on change rather than an instant digit swap. Non-numeric or
// unchanged values pass through untouched. Respects prefers-reduced-motion
// (design-system.md §11.6) by skipping straight to the target value.
//
// The pass-through/reduced-motion cases update state synchronously during
// render (React's documented "adjusting state when a prop changes"
// pattern, using useState pairs rather than refs -- refs may not be read
// or written during render). Only the actual requestAnimationFrame-driven
// animation -- a real subscription to an external system -- lives in the
// effect below, and it only ever calls setState from its own callbacks.
export function useCountUp(value: number | string, durationMs = 400): number | string {
  const [display, setDisplay] = useState(value);
  const [trackedValue, setTrackedValue] = useState(value);
  const [animateFrom, setAnimateFrom] = useState<number | null>(null);

  if (value !== trackedValue) {
    setTrackedValue(value);
    const canAnimate = typeof value === "number" && typeof display === "number" && !prefersReducedMotion();
    if (canAnimate) {
      setAnimateFrom(display as number);
    } else {
      setDisplay(value);
    }
  }

  useEffect(() => {
    if (animateFrom === null || typeof value !== "number") return;
    const from = animateFrom;
    const to = value;
    const start = performance.now();
    let frame: number;

    function tick(now: number) {
      const progress = Math.min((now - start) / durationMs, 1);
      setDisplay(Math.round(from + (to - from) * progress));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setAnimateFrom(null);
      }
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animateFrom, value, durationMs]);

  return display;
}
