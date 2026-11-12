import type { Coordinate, HighRiskArea, TrackedUser } from "@/lib/types";

/**
 * Pretend data for the hands-on tour, so a brand-new caregiver has someone to
 * click on. Lives only in memory while the tour runs — never written anywhere —
 * and only appears when the real list is empty.
 */

export const DEMO_PERSON_ID = "wenav-tour-example";

/** A short loop around downtown Salt Lake City. */
const DEMO_WALK: Coordinate[] = [
  { lat: 40.7616, lng: -111.8945 },
  { lat: 40.7616, lng: -111.8905 },
  { lat: 40.7607, lng: -111.8885 },
  { lat: 40.7589, lng: -111.8885 },
  { lat: 40.7575, lng: -111.8885 },
  { lat: 40.7575, lng: -111.8862 },
];

function todayAt(hours: number, minutes: number): string {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

export function demoPerson(): TrackedUser {
  const here = DEMO_WALK[DEMO_WALK.length - 1];
  return {
    id: DEMO_PERSON_ID,
    name: "Alex (example)",
    status: "walking",
    lastLocation: here,
    hasLocation: true,
    lastUpdated: "just now",
    route: DEMO_WALK,
    vestBattery: 82,
    vestConnected: true,
    homeAddress: "200 S Main St, Salt Lake City",
    emergencyContact: { name: "You", phone: "(555) 010-0000" },
    history: [
      {
        id: "tour-stop-1",
        title: "Left home",
        time: "9:05 AM",
        recordedAt: todayAt(9, 5),
        location: DEMO_WALK[0],
      },
      {
        id: "tour-stop-2",
        title: "Stopped at a crossing",
        time: "9:14 AM",
        recordedAt: todayAt(9, 14),
        duration: "2 min",
        location: DEMO_WALK[3],
      },
    ],
  };
}

/** The example walk as the map's route pieces. */
export const DEMO_ROUTE: Coordinate[][] = [DEMO_WALK];

export const DEMO_RISK_AREA: HighRiskArea = {
  id: "wenav-tour-example-risk",
  lat: 40.7608,
  lng: -111.891,
  label: "Busy crossing (example)",
  createdBy: "WeNav tour",
  createdAt: "",
};
