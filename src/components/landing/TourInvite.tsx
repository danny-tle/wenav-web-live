"use client";

import { useEffect, useId, useState } from "react";
import { MousePointerClick, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useHomeTour } from "@/components/landing/HomeTour";

/** Remembers the visitor's answer, so we only ask once per browser. */
export const TOUR_INVITE_KEY = "wenav:home-tour-invite:v1";

/** Let the homepage settle before asking. */
const DELAY_MS = 1500;

function alreadyAnswered(): boolean {
  try {
    return window.localStorage.getItem(TOUR_INVITE_KEY) !== null;
  } catch {
    return false;
  }
}

function rememberAnswer(answer: "yes" | "no") {
  try {
    window.localStorage.setItem(TOUR_INVITE_KEY, answer);
  } catch {
    // Storage blocked: we may ask again next visit, which is fine.
  }
}

/**
 * Asks logged-out visitors whether they'd like a quick, hands-on tour of the
 * homepage map. Yes starts it right here; No puts the question away. Either
 * way we don't ask again. "Take the tour" in the navbar stays for anyone who
 * changes their mind.
 */
export default function TourInvite({ ready = true }: {
  /** Hold off until the homepage is done showing off (the globe intro). */
  ready?: boolean;
}) {
  const { isLoggedIn, isLoading } = useAuth();
  const { start } = useHomeTour();
  const [visible, setVisible] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!ready || isLoading || isLoggedIn || alreadyAnswered()) return;
    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, [ready, isLoading, isLoggedIn]);

  if (!visible || isLoggedIn) return null;

  function decline() {
    rememberAnswer("no");
    setVisible(false);
  }

  function accept() {
    rememberAnswer("yes");
    setVisible(false);
    start();
  }

  return (
    <div
      role="dialog"
      aria-labelledby={titleId}
      className="fixed inset-x-4 bottom-4 z-[1500] rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-black/5 motion-safe:animate-[intro-caption_400ms_ease-out] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[360px]"
    >
      <button
        type="button"
        onClick={decline}
        aria-label="Close"
        className="absolute right-3 top-3 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-wenav-gray hover:text-gray-600"
      >
        <X size={16} />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-wenav-purple/10 text-wenav-purple">
          <MousePointerClick size={20} aria-hidden="true" />
        </div>
        <div>
          <h2 id={titleId} className="font-semibold text-wenav-dark">
            New here? Want a quick tour?
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            Try out the hazard map for yourself: open a reported hazard, search
            anywhere, and see what WeNav can do. It takes a minute.
          </p>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={decline}
          className="rounded-wenav px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-wenav-gray"
        >
          No thanks
        </button>
        <button
          type="button"
          onClick={accept}
          className="rounded-wenav bg-wenav-purple px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-wenav-purple/90"
        >
          Yes, show me
        </button>
      </div>
    </div>
  );
}
