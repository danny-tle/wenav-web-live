/**
 * The hands-on part of the first-run tour. Each step spotlights a real piece
 * of a page and, for most, asks the caregiver to actually use it before
 * moving on.
 *
 * `target` matches a `data-tour="…"` attribute on the page. When several
 * elements share it (the sidebar and the phone tab bar both have
 * "nav-my-users"), the spotlight uses whichever one is on screen.
 */

import type { TourSignalName } from "@/lib/tourSignal";

/** Something the caregiver has to do before the step counts as done. */
export type TourAction =
  /** Click anything inside the spotlight. */
  | { type: "click"; hint: string; done: string }
  /** Drag or scroll-zoom inside the spotlight (for the map). */
  | { type: "interact"; hint: string; done: string }
  /**
   * Click inside the spotlight, which opens a window of its own. Once they
   * have, the tour steps aside so they can look at it, and waits for Next.
   */
  | { type: "open"; hint: string; done: string }
  /** Wait for the page to say they did it (see lib/tourSignal). */
  | { type: "signal"; name: TourSignalName; hint: string; done: string }
  /** Go to another page with the menu. The tour carries on there by itself. */
  | { type: "navigate"; to: TourPage; hint: string };

/** A caregiver dashboard page, relative to /dashboard. "" is the main map. */
export type TourPage = "" | "/my-users" | "/incidents" | "/settings";

export interface TourStep {
  id: string;
  /** The page this step happens on. */
  page: TourPage;
  target: string;
  title: string;
  body: string;
  /** Absent for steps that are just a look. */
  action?: TourAction;
}

/** What the spotlight needs to show a step, wherever the tour runs. */
export type SpotlightStep = Omit<TourStep, "page">;

export const TOUR_STEPS: TourStep[] = [
  {
    id: "map",
    page: "",
    target: "dashboard-map",
    title: "The live map",
    body: "Everyone you're connected to appears here. A purple pin is where they are right now while they walk; a grey pin is the last place we heard from them.",
    action: {
      type: "interact",
      hint: "Try it: drag the map, or scroll to zoom.",
      done: "That's it. Zoom in close and the map tilts to 3D so you can see the buildings around them.",
    },
  },
  {
    id: "people",
    page: "",
    target: "dashboard-users",
    title: "Your people",
    body: "Everyone you look after is listed here. If you haven't connected anyone yet, Alex is a pretend example for the tour.",
    action: {
      type: "click",
      hint: "Try it: click a name.",
      done: "The map flew straight to them. Use this whenever you want to find someone fast.",
    },
  },
  {
    id: "risk",
    page: "",
    target: "dashboard-risk",
    title: "Risk areas",
    body: "Spots our team has flagged as hazardous, like busy crossings or broken pavement. They show on the map as blue circles.",
    action: {
      type: "click",
      hint: "Try it: click a risk area.",
      done: "There it is on the map.",
    },
  },
  {
    id: "go-my-users",
    page: "",
    target: "nav-my-users",
    title: "On to My Users",
    body: "My Users is where you connect people and look at their day in detail.",
    action: { type: "navigate", to: "/my-users", hint: "Click My Users in the menu." },
  },
  {
    id: "my-users",
    page: "/my-users",
    target: "my-users-list",
    title: "Their day at a glance",
    body: "Pick someone to see today's walk on the map, the stops they made along the way, and their details.",
    action: {
      type: "click",
      hint: "Try it: click a name.",
      done: "Today's walk is drawn on the map, with their stops and details alongside.",
    },
  },
  {
    id: "add-user",
    page: "/my-users",
    target: "add-user",
    title: "Connect someone",
    body: "The person you look after opens the WeNav app and generates a pairing code under Caregiver. You enter it here to link your accounts. They choose what you can see, and can disconnect any time.",
    action: {
      type: "open",
      hint: "Try it: click +.",
      done: "This is where their code goes. Have a look, then press Next.",
    },
  },
  {
    id: "go-incidents",
    page: "/my-users",
    target: "nav-incidents",
    title: "On to incidents",
    body: "Next up: reporting hazards you spot while you're out.",
    action: { type: "navigate", to: "/incidents", hint: "Click Incidents in the menu." },
  },
  {
    id: "track",
    page: "/incidents",
    target: "incident-filters",
    title: "Follow your reports",
    body: "Everything you've reported is listed here. Each report shows whether it's in process, complete, or missing information.",
    action: {
      type: "click",
      hint: "Try it: change a filter or the sort order.",
      done: "The list updates as you go.",
    },
  },
  {
    id: "report",
    page: "/incidents",
    target: "report-incident",
    title: "Report a hazard",
    body: "Seen a blocked path, construction or an uneven sidewalk? Our team reviews every report, and approved ones go on the public map so everyone can route around them.",
    action: {
      type: "open",
      hint: "Try it: click Report Incident.",
      done: "Here's the report form. No need to send anything now. Press Next when you're done looking.",
    },
  },
  {
    id: "go-settings",
    page: "/incidents",
    target: "nav-settings",
    title: "Last stop: Settings",
    body: "Your account and notification settings live here.",
    action: { type: "navigate", to: "/settings", hint: "Click Settings in the menu." },
  },
  {
    id: "settings",
    page: "/settings",
    target: "settings-tour",
    title: "Take the tour again",
    body: "Change your name or password and choose your notifications on this page. If you ever want a refresher, start this tour again from here.",
  },
];
