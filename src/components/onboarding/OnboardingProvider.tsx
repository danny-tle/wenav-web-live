"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { hasCompletedOnboarding, isNewAccount, markOnboardingComplete } from "@/lib/onboarding";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import TourSpotlight from "@/components/onboarding/TourSpotlight";
import { TOUR_STEPS, type TourPage } from "@/components/onboarding/tourSteps";

interface OnboardingContextValue {
  /** Show the tour again, from the welcome. */
  startTour: () => void;
  /**
   * True during the hands-on walkthrough. Pages with nothing to show yet put
   * in pretend examples (see demoData) so there's something to click.
   */
  tourActive: boolean;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

/** Where the tour is: closed, the welcome, step N of the walkthrough, or the send-off. */
type TourState = { kind: "closed" } | { kind: "intro" } | { kind: "step"; index: number } | { kind: "outro" };

/**
 * Runs the first-run tour: a welcome, then a hands-on walkthrough of the real
 * pages — each step spotlights a control and has them try it — then a chance
 * to connect someone for real.
 *
 * It opens by itself once, for new caregiver accounts. Anyone can start it
 * again from Settings. Admins have their own console and never get it.
 */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [tour, setTour] = useState<TourState>({ kind: "closed" });
  // Remount the dialogs on every start so they always begin fresh.
  const [runId, setRunId] = useState(0);

  const steps = TOUR_STEPS;
  const pathFor = useCallback((page: TourPage) => `/dashboard${page}`, []);

  const uid = user?.uid;
  const eligible = Boolean(uid) && role === "user";
  const creationTime = user?.metadata?.creationTime;

  // Open by itself at most once per visit, so a refreshed user object can't
  // yank someone back to the welcome mid-tour.
  const autoOpened = useRef(false);
  useEffect(() => {
    if (autoOpened.current) return;
    if (eligible && uid && isNewAccount(creationTime) && !hasCompletedOnboarding(uid)) {
      autoOpened.current = true;
      setTour({ kind: "intro" });
    }
  }, [eligible, uid, creationTime]);

  const step = tour.kind === "step" ? steps[tour.index] : null;
  // The step whose action they've done. Keyed by id so it resets on its own
  // when the step changes.
  const [doneStepId, setDoneStepId] = useState<string | null>(null);
  const markDone = useCallback(() => {
    if (step) setDoneStepId(step.id);
  }, [step]);

  // Each step happens on a particular page. Take them there when the step
  // starts — but only then, so the "click the menu" steps can move them on
  // without being dragged back.
  const routedStepId = useRef<string | null>(null);
  useEffect(() => {
    if (!step || routedStepId.current === step.id) return;
    routedStepId.current = step.id;
    const where = pathFor(step.page);
    if (pathname !== where) router.push(where);
  }, [step, pathname, router, pathFor]);

  const startTour = useCallback(() => {
    setRunId((n) => n + 1);
    setTour({ kind: "intro" });
  }, []);

  const close = useCallback(() => {
    if (uid) markOnboardingComplete(uid);
    routedStepId.current = null;
    setTour({ kind: "closed" });
  }, [uid]);

  const finish = useCallback(() => {
    close();
    router.push(pathFor(""));
  }, [close, router, pathFor]);

  // Leaving a step where they opened a window (the pairing code, the report
  // form)? Close it, so it isn't sitting over the page for the next step.
  const closeOpenedWindow = useCallback(() => {
    if (step?.action?.type === "open") {
      document.querySelector<HTMLElement>("[data-tour-close]")?.click();
    }
  }, [step]);

  const next = useCallback(() => {
    closeOpenedWindow();
    setTour((t) => {
      if (t.kind !== "step") return t;
      return t.index + 1 < steps.length ? { kind: "step", index: t.index + 1 } : { kind: "outro" };
    });
  }, [closeOpenedWindow, steps.length]);

  const back = useCallback(() => {
    closeOpenedWindow();
    setTour((t) => (t.kind === "step" && t.index > 0 ? { kind: "step", index: t.index - 1 } : t));
  }, [closeOpenedWindow]);

  // A "click the menu" step is done when they arrive on the new page; carry
  // on from there without making them press Next as well. Only count it once
  // they've been on the step's own page, so pressing Back onto this step
  // doesn't bounce them straight forward again.
  const onStepRoute = useRef(false);
  useEffect(() => {
    onStepRoute.current = false;
  }, [step?.id]);
  useEffect(() => {
    if (!step || step.action?.type !== "navigate") return;
    if (pathname === pathFor(step.page)) onStepRoute.current = true;
    else if (onStepRoute.current && pathname === pathFor(step.action.to)) next();
  }, [step, pathname, next, pathFor]);

  let overlay: ReactNode = null;
  if (eligible) {
    if (tour.kind === "intro") {
      overlay = (
        <OnboardingWizard
          key={`intro-${runId}`}
          stage="intro"
          uid={uid ?? ""}
          displayName={user?.displayName ?? ""}
          onStart={() => setTour({ kind: "step", index: 0 })}
          onClose={close}
        />
      );
    } else if (tour.kind === "outro") {
      overlay = (
        <OnboardingWizard
          key={`outro-${runId}`}
          stage="outro"
          uid={uid ?? ""}
          displayName={user?.displayName ?? ""}
          onClose={finish}
        />
      );
    } else if (step && tour.kind === "step") {
      overlay = (
        <TourSpotlight
          step={step}
          index={tour.index}
          total={steps.length}
          done={!step.action || doneStepId === step.id}
          onDone={markDone}
          onNext={next}
          onBack={back}
          onSkip={close}
        />
      );
    }
  }

  return (
    <OnboardingContext.Provider value={{ startTour, tourActive: tour.kind === "step" }}>
      {children}
      {overlay}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error("useOnboarding must be used within an OnboardingProvider");
  return context;
}
