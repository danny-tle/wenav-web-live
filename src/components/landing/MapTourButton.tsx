"use client";

import { ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useHomeTour } from "@/components/landing/HomeTour";

/**
 * "New here? Take the tour" for logged-out visitors, tucked under the search
 * bar on the homepage map (HeroMap positions it). It stays hidden during the
 * globe intro and while the tour is running.
 */
export default function MapTourButton({ ready = true }: {
  /** Hold off until the globe intro has finished. */
  ready?: boolean;
}) {
  const { isLoggedIn, isLoading } = useAuth();
  const { start, active } = useHomeTour();

  if (isLoading || isLoggedIn) return null;
  const shown = ready && !active;

  return (
    // A soft backing keeps the text readable over the map's lines.
    <button
      type="button"
      onClick={start}
      tabIndex={shown ? 0 : -1}
      aria-hidden={!shown || undefined}
      className={`group inline-flex items-center gap-1.5 rounded-full bg-white/75 px-3.5 py-1.5 text-sm shadow-sm backdrop-blur-sm transition-opacity duration-500 hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wenav-violet ${
        shown ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <span className="text-gray-500">New here?</span>
      <span className="font-medium text-wenav-violet">Take the tour</span>
      <ArrowRight
        size={14}
        strokeWidth={2}
        aria-hidden="true"
        className="text-wenav-violet transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
      />
    </button>
  );
}
