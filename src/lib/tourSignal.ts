/**
 * Lets a page tell a running tour "they just did the thing" — picked a search
 * result, opened a pin — when a plain click inside the spotlight isn't enough
 * to know. Pages call `tourSignal(name)`; a tour step with
 * `{ type: "signal", name }` waits for it. With no tour running, nobody's
 * listening and it does nothing.
 */
export const TOUR_SIGNAL_EVENT = "wenav-tour-signal";

export type TourSignalName = "pin-opened" | "zoomed-out" | "search-picked";

export function tourSignal(name: TourSignalName): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<TourSignalName>(TOUR_SIGNAL_EVENT, { detail: name }));
}
