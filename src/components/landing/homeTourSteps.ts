import type { SpotlightStep } from "@/components/onboarding/tourSteps";

/**
 * The homepage tour for visitors: a hands-on look at the public hazard map.
 * Targets are `data-tour` attributes on the homepage.
 */
export const HOME_TOUR_STEPS: SpotlightStep[] = [
  {
    id: "map",
    target: "home-map",
    title: "The live hazard map",
    body: "Every red pin is a hazard someone reported and our team confirmed: blocked paths, construction, uneven sidewalks and more.",
    action: {
      type: "interact",
      hint: "Try it: drag the map, or scroll to zoom.",
      done: "That's it. Zoom in close and the map tilts to 3D so you can see the buildings.",
    },
  },
  {
    id: "pin",
    target: "home-map",
    title: "Look at a hazard",
    body: "Click a red pin to fly down to street level and see what was reported, where, and when.",
    action: {
      type: "signal",
      name: "pin-opened",
      hint: "Try it: click a red pin.",
      done: "You're at street level, with the details above the pin.",
    },
  },
  {
    id: "zoom-out",
    target: "home-zoom-out",
    title: "Back out",
    body: "Done looking? Zoom back out to where you were.",
    action: {
      type: "signal",
      name: "zoomed-out",
      hint: "Try it: click Zoom out.",
      done: "Back to the overview.",
    },
  },
  {
    id: "search",
    target: "home-search",
    title: "Check anywhere",
    body: "Search for an address or place to see the hazards around it before you head out.",
    action: {
      type: "signal",
      name: "search-picked",
      hint: "Try it: search for a place and pick a result.",
      done: "The map flew straight there.",
    },
  },
  {
    id: "account",
    target: "home-account",
    title: "Looking after someone?",
    body: "Caregivers sign in here to follow the people they look after on a live map while they walk, and to report hazards they spot.",
  },
];
