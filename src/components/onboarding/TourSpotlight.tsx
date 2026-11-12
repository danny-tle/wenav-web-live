"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Hand, X } from "lucide-react";
import type { SpotlightStep } from "@/components/onboarding/tourSteps";
import { TOUR_SIGNAL_EVENT } from "@/lib/tourSignal";

interface TourSpotlightProps {
  step: SpotlightStep;
  index: number;
  total: number;
  /** The caregiver has done what this step asked (or it didn't ask anything). */
  done: boolean;
  /** Called the first time they do it. */
  onDone: () => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

/** Gap between the highlighted element and the ring around it. */
const PADDING = 6;
/** Gap between the ring and the explanation card. */
const GAP = 14;
/** Keep the card this far from the window edges. */
const MARGIN = 16;
/** Give up looking for a step's element after this long and explain it anyway. */
const FIND_TIMEOUT_MS = 5000;
/** How far a press has to move before it counts as dragging the map. */
const DRAG_PX = 8;

const DIM = "rgba(13, 8, 30, 0.55)";

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** The first element tagged `data-tour={target}` that's actually on screen. */
export function findTourTarget(target: string): HTMLElement | null {
  const candidates = document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`);
  for (const el of Array.from(candidates)) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0 && getComputedStyle(el).visibility !== "hidden") {
      return el;
    }
  }
  return null;
}

function sameBox(a: Box | null, b: Box | null): boolean {
  if (!a || !b) return a === b;
  return (
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}

/**
 * Where to put the explanation card: below, above, right or left of the
 * spotlight, whichever fits first. If the highlighted thing fills the screen
 * (the dashboard map does), the card sits over its lower edge instead.
 */
export function placeCard(
  hole: Box,
  card: { width: number; height: number },
  viewport: { width: number; height: number }
): { top: number; left: number } {
  const clampLeft = (left: number) =>
    Math.min(Math.max(left, MARGIN), viewport.width - card.width - MARGIN);
  const clampTop = (top: number) =>
    Math.min(Math.max(top, MARGIN), viewport.height - card.height - MARGIN);
  const centeredLeft = clampLeft(hole.left + hole.width / 2 - card.width / 2);
  const centeredTop = clampTop(hole.top + hole.height / 2 - card.height / 2);

  const below = hole.top + hole.height + GAP;
  if (below + card.height <= viewport.height - MARGIN) return { top: below, left: centeredLeft };

  const above = hole.top - GAP - card.height;
  if (above >= MARGIN) return { top: above, left: centeredLeft };

  const right = hole.left + hole.width + GAP;
  if (right + card.width <= viewport.width - MARGIN) return { top: centeredTop, left: right };

  const left = hole.left - GAP - card.width;
  if (left >= MARGIN) return { top: centeredTop, left };

  return {
    top: clampTop(Math.min(hole.top + hole.height, viewport.height) - card.height - MARGIN * 2),
    left: centeredLeft,
  };
}

/**
 * Watch the highlighted element for whatever the step asked them to try.
 * Returns a cleanup function.
 */
function watchForAction(el: HTMLElement, type: "click" | "interact" | "open", onDone: () => void) {
  if (type === "click" || type === "open") {
    el.addEventListener("click", onDone, { capture: true, once: true });
    return () => el.removeEventListener("click", onDone, { capture: true });
  }

  // "interact": a drag past a few pixels, or a scroll-zoom.
  let start: { x: number; y: number } | null = null;
  const onDown = (e: PointerEvent) => {
    start = { x: e.clientX, y: e.clientY };
  };
  const onMove = (e: PointerEvent) => {
    if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > DRAG_PX) onDone();
  };
  const onUp = () => {
    start = null;
  };
  el.addEventListener("pointerdown", onDown, true);
  window.addEventListener("pointermove", onMove, true);
  window.addEventListener("pointerup", onUp, true);
  el.addEventListener("wheel", onDone, { capture: true, passive: true });
  return () => {
    el.removeEventListener("pointerdown", onDown, true);
    window.removeEventListener("pointermove", onMove, true);
    window.removeEventListener("pointerup", onUp, true);
    el.removeEventListener("wheel", onDone, { capture: true });
  };
}

export default function TourSpotlight({
  step,
  index,
  total,
  done,
  onDone,
  onNext,
  onBack,
  onSkip,
}: TourSpotlightProps) {
  const [hole, setHole] = useState<Box | null>(null);
  const [searching, setSearching] = useState(true);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const bodyId = useId();

  const action = step.action;
  const isFirst = index === 0;
  const isLast = index === total - 1;
  // After they open a window (the pairing code, the report form), get out of
  // its way: no dimming, no click shield, and the card tucks into a corner.
  const released = action?.type === "open" && done;
  const waiting = Boolean(action) && !done;

  // Find the step's element (its page may still be loading), bring it into
  // view, then follow it as the page scrolls, resizes or lays itself out.
  useEffect(() => {
    let frame = 0;
    let found: HTMLElement | null = null;
    const startedAt = performance.now();
    setHole(null);
    setTarget(null);
    setSearching(true);

    const tick = () => {
      if (!found) {
        found = findTourTarget(step.target);
        if (found) {
          // Already fully on screen? Leave the page where it is. Otherwise
          // bring it in, centered if it fits so there's room for the card.
          const r = found.getBoundingClientRect();
          const onScreen = r.top >= 0 && r.bottom <= window.innerHeight && r.left >= 0 && r.right <= window.innerWidth;
          if (!onScreen) {
            const fits = r.height < window.innerHeight * 0.6;
            found.scrollIntoView({ block: fits ? "center" : "nearest", inline: "nearest" });
          }
          setTarget(found);
          setSearching(false);
        } else if (performance.now() - startedAt > FIND_TIMEOUT_MS) {
          setSearching(false);
          return;
        }
      }
      if (found) {
        if (!found.isConnected) {
          found = null;
          setTarget(null);
        } else {
          const r = found.getBoundingClientRect();
          const next: Box = {
            top: r.top - PADDING,
            left: r.left - PADDING,
            width: r.width + PADDING * 2,
            height: r.height + PADDING * 2,
          };
          setHole((prev) => (sameBox(prev, next) ? prev : next));
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [step.target]);

  // Wait for them to try the thing. (Navigation is watched by the provider,
  // since it happens by changing page.)
  useEffect(() => {
    if (!action || done || action.type === "navigate") return;
    if (action.type === "signal") {
      const onSignal = (event: Event) => {
        if ((event as CustomEvent).detail === action.name) onDone();
      };
      window.addEventListener(TOUR_SIGNAL_EVENT, onSignal);
      return () => window.removeEventListener(TOUR_SIGNAL_EVENT, onSignal);
    }
    if (!target) return;
    return watchForAction(target, action.type, onDone);
  }, [target, action, done, onDone]);

  // Place the card once we know both its size and the spotlight's.
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const size = { width: card.offsetWidth, height: card.offsetHeight };
    if (released) {
      // Bottom-left on a desktop, along the bottom on a phone, clear of the
      // window they just opened (which sits in the middle).
      setCardPos({ top: viewport.height - size.height - MARGIN, left: MARGIN });
    } else if (hole) {
      setCardPos(placeCard(hole, size, viewport));
    } else {
      setCardPos({ top: (viewport.height - size.height) / 2, left: (viewport.width - size.width) / 2 });
    }
  }, [hole, step.id, searching, released, done]);

  // Put focus on Next once it's usable; until then leave it on the page so
  // they can try the thing with the keyboard too.
  useEffect(() => {
    if (!waiting) nextRef.current?.focus();
  }, [step.id, waiting]);

  // Escape ends the tour.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !released) {
        event.preventDefault();
        onSkip();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onSkip, released]);

  // The click shield: four panels around the spotlight, so the highlighted
  // thing itself stays usable. Without a spotlight, one panel over everything.
  const shields: Box[] = released
    ? []
    : hole
      ? [
          { top: 0, left: 0, width: window.innerWidth, height: Math.max(0, hole.top) },
          { top: hole.top + hole.height, left: 0, width: window.innerWidth, height: Math.max(0, window.innerHeight - hole.top - hole.height) },
          { top: hole.top, left: 0, width: Math.max(0, hole.left), height: hole.height },
          { top: hole.top, left: hole.left + hole.width, width: Math.max(0, window.innerWidth - hole.left - hole.width), height: hole.height },
        ]
      : [{ top: 0, left: 0, width: window.innerWidth, height: window.innerHeight }];

  return (
    <>
      {shields.map((box, i) => (
        <div key={i} aria-hidden="true" className="fixed z-[3000]" style={box} />
      ))}

      {!released && (
        <div
          aria-hidden="true"
          className={`pointer-events-none fixed z-[3001] rounded-xl transition-all duration-300 ease-out motion-reduce:transition-none ${
            hole ? "ring-2 ring-wenav-purple" : ""
          } ${hole && waiting ? "animate-[tour-pulse_1.8s_ease-in-out_infinite] motion-reduce:animate-none" : ""}`}
          style={
            hole
              ? { top: hole.top, left: hole.left, width: hole.width, height: hole.height, boxShadow: `0 0 0 9999px ${DIM}` }
              : { inset: 0, boxShadow: `inset 0 0 0 9999px ${DIM}`, borderRadius: 0, opacity: searching ? 0.6 : 1 }
          }
        />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="fixed z-[3002] w-[min(360px,calc(100vw-32px))] rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-black/5 transition-[top,left] duration-300 ease-out motion-reduce:transition-none"
        style={cardPos ?? { top: -9999, left: -9999 }}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-wenav-purple">
            {index + 1} of {total}
          </p>
          <button
            type="button"
            onClick={onSkip}
            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-gray-400 transition-colors hover:bg-wenav-gray hover:text-gray-600"
          >
            Skip tour
            <X size={13} aria-hidden="true" />
          </button>
        </div>
        <h2 id={titleId} className="mt-1 text-lg font-bold text-wenav-dark">
          {step.title}
        </h2>
        {!released && (
          <p id={bodyId} className="mt-2 text-sm leading-relaxed text-gray-600">
            {step.body}
          </p>
        )}

        {action && (
          <p
            aria-live="polite"
            className={`mt-3 flex items-start gap-2 rounded-wenav px-3 py-2.5 text-sm ${
              done ? "bg-green-50 text-green-800" : "bg-wenav-purple/10 text-wenav-purple"
            }`}
          >
            {done ? (
              <Check size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
            ) : (
              <Hand size={16} className="mt-0.5 flex-shrink-0 motion-safe:animate-bounce" aria-hidden="true" />
            )}
            <span className="font-medium">{done && action.type !== "navigate" ? action.done : action.hint}</span>
          </p>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex gap-1" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-4 bg-wenav-purple" : i < index ? "w-1.5 bg-wenav-purple/40" : "w-1.5 bg-gray-200"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1">
            {!isFirst && (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1 rounded-wenav px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-wenav-gray"
              >
                <ArrowLeft size={15} aria-hidden="true" />
                Back
              </button>
            )}
            {waiting ? (
              // Not forced: they can always move on without trying it.
              <button
                type="button"
                onClick={onNext}
                className="whitespace-nowrap rounded-wenav px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-wenav-gray hover:text-gray-600"
              >
                Skip step
              </button>
            ) : (
              <button
                ref={nextRef}
                type="button"
                onClick={onNext}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-wenav bg-wenav-dark px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-wenav-dark/85"
              >
                {isLast ? "Finish" : "Next"}
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
