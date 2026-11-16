"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
} from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

interface Options {
  /** Time between automatic moves, in ms. */
  interval?: number;
  /** Length of the slide animation, in ms. */
  duration?: number;
}

/**
 * An endless, auto-advancing carousel.
 *
 * The items are rendered three times in a row (`slots`) and the track sits on
 * the middle copy. After each move that lands in the first or last copy, the
 * track jumps back to the same item in the middle copy with the animation off,
 * so the loop never visibly rewinds.
 *
 * Auto-advance pauses while the pointer is over the carousel, while anything
 * inside it has keyboard focus, while the tab is hidden, and entirely for
 * people who have asked their system to reduce motion.
 */
export function useLoopingCarousel(
  count: number,
  { interval = 2000, duration = 500 }: Options = {},
) {
  const trackRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const [index, setIndex] = useState(count);
  const indexRef = useRef(count);
  const [animate, setAnimate] = useState(false);
  const [offset, setOffset] = useState(0);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const busy = useRef(false);
  const settleTimer = useRef<number>();

  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);
  // Bumped on manual moves so the auto-advance timer starts over.
  const [manualMoves, setManualMoves] = useState(0);

  // Keep any virtual index inside the middle copy.
  const normalize = useCallback(
    (i: number) => count + (((i % count) + count) % count),
    [count],
  );

  const jumpTo = useCallback((i: number) => {
    indexRef.current = i;
    setAnimate(false);
    setIndex(i);
  }, []);

  const go = useCallback(
    (delta: number) => {
      if (count < 2 || busy.current) return;
      const target = indexRef.current + delta;

      if (reducedMotion) {
        jumpTo(normalize(target));
        return;
      }

      busy.current = true;
      indexRef.current = target;
      setAnimate(true);
      setIndex(target);

      window.clearTimeout(settleTimer.current);
      settleTimer.current = window.setTimeout(() => {
        busy.current = false;
        const settled = normalize(indexRef.current);
        if (settled !== indexRef.current) jumpTo(settled);
      }, duration + 50);
    },
    [count, duration, jumpTo, normalize, reducedMotion],
  );

  const next = useCallback(() => {
    setManualMoves((n) => n + 1);
    go(1);
  }, [go]);

  const prev = useCallback(() => {
    setManualMoves((n) => n + 1);
    go(-1);
  }, [go]);

  useEffect(() => () => window.clearTimeout(settleTimer.current), []);

  // Line the track up with the current item.
  useIsomorphicLayoutEffect(() => {
    const item = trackRef.current?.children[index] as HTMLElement | undefined;
    if (item) setOffset(item.offsetLeft);
  }, [index, layoutVersion]);

  // Re-measure when the layout changes, without animating the correction.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      setAnimate(false);
      setLayoutVersion((v) => v + 1);
    });
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const update = () => setPageHidden(document.visibilityState === "hidden");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  const paused = hovered || focused || pageHidden || reducedMotion;

  useEffect(() => {
    if (paused || count < 2) return;
    const id = window.setInterval(() => go(1), interval);
    return () => window.clearInterval(id);
  }, [paused, go, interval, count, manualMoves]);

  const trackStyle: CSSProperties = {
    transform: `translate3d(${-offset}px, 0, 0)`,
    transition: animate
      ? `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`
      : "none",
  };

  /** Spread onto the element that wraps the controls and the track. */
  const pauseProps = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onFocus: () => setFocused(true),
    onBlur: (e: FocusEvent<HTMLElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
        setFocused(false);
      }
    },
  };

  const slots = Array.from({ length: count * 3 }, (_, i) => i);

  return {
    trackRef,
    trackStyle,
    pauseProps,
    slots,
    /** Which real item (0-based) a slot shows. */
    itemAt: (slot: number) => slot % count,
    /** Slots outside the middle copy are visual duplicates only. */
    isClone: (slot: number) => slot < count || slot >= count * 2,
    /** The slot currently aligned to the start of the viewport. */
    currentSlot: index,
    activeIndex: index % count,
    next,
    prev,
  };
}
