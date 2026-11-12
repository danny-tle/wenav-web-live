"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import TourSpotlight from "@/components/onboarding/TourSpotlight";
import { HOME_TOUR_STEPS } from "@/components/landing/homeTourSteps";

interface HomeTourValue {
  /** Start the homepage tour from the first step. */
  start: () => void;
  /** True while it's running (the hero skips its intro for it). */
  active: boolean;
}

const HomeTourContext = createContext<HomeTourValue>({ start: () => {}, active: false });

/**
 * Runs the visitors' hands-on tour of the homepage map. Visitors opt in, from
 * the invite card or the navbar's "Take the tour"; it's never forced on them.
 */
export function HomeTourProvider({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState<number | null>(null);
  const [doneStepId, setDoneStepId] = useState<string | null>(null);

  const step = index === null ? null : HOME_TOUR_STEPS[index];

  const start = useCallback(() => {
    setDoneStepId(null);
    setIndex(0);
  }, []);
  const stop = useCallback(() => setIndex(null), []);
  const next = useCallback(
    () => setIndex((i) => (i === null || i + 1 >= HOME_TOUR_STEPS.length ? null : i + 1)),
    []
  );
  const back = useCallback(() => setIndex((i) => (i === null ? null : Math.max(0, i - 1))), []);
  const markDone = useCallback(() => {
    if (step) setDoneStepId(step.id);
  }, [step]);

  return (
    <HomeTourContext.Provider value={{ start, active: index !== null }}>
      {children}
      {step && index !== null && (
        <TourSpotlight
          step={step}
          index={index}
          total={HOME_TOUR_STEPS.length}
          done={!step.action || doneStepId === step.id}
          onDone={markDone}
          onNext={next}
          onBack={back}
          onSkip={stop}
        />
      )}
    </HomeTourContext.Provider>
  );
}

export function useHomeTour(): HomeTourValue {
  return useContext(HomeTourContext);
}
