export interface Coordinate {
  lat: number;
  lng: number;
}

export interface Incident {
  id: string;
  type:
    | "blocked_path"
    | "construction"
    | "uneven_sidewalk"
    | "low_obstacle"
    | "other";
  status: "approved" | "not_confirmed" | "under_review";
  location: Coordinate;
  address: string;
  description: string;
  reportedAt: string;
  reportedBy: string;
  verificationNote?: string;
  lastUpdated?: string;
}

export interface PublicIncident {
  id: string;
  type: Incident["type"];
  location: Coordinate;
  address: string;
  reportedAt: string;
  lastUpdated?: string;
}

/** What a caregiver may see about one specific person. */
export interface LinkScopes {
  liveLocation: boolean;
  incidents: boolean;
  history: boolean;
}

/**
 * A caregiver relationship, stored at `links/{userId}_{caregiverId}`.
 *
 * "Caregiver" is a property of this document, not of an account — the same
 * person can be a WeNav user and a caregiver for someone else. Created only
 * by the `redeemPairingCode` Cloud Function; see firestore.rules.
 */
export interface CaregiverLink {
  id: string;
  /** The person being cared for — whose data is shared. */
  userId: string;
  /** The person watching. Their own location is never shared back. */
  caregiverId: string;
  userName: string;
  caregiverName: string;
  scopes: LinkScopes;
  createdAt?: string;
}

/** One overwritten document per user at `liveLocations/{userId}`. */
export interface LiveLocation {
  userId: string;
  location: Coordinate;
  status: "walking" | "idle" | "offline";
  /** Epoch millis, for staleness checks. */
  updatedAtMs: number;
  vestBattery?: number;
  vestConnected?: boolean;
}

export interface TrackedUser {
  id: string;
  name: string;
  avatar?: string;
  status: "walking" | "idle" | "offline";
  lastLocation: Coordinate;
  /**
   * False when no position has ever been recorded for this person, so the map
   * can skip the pin instead of dropping it at 0,0 in the Gulf of Guinea.
   * Absent on mock data, which always has a position.
   */
  hasLocation?: boolean;
  /** Human phrasing — "2 min ago", "never" — not a fixed clock time. */
  lastUpdated: string;
  route: Coordinate[];
  vestBattery: number;
  vestConnected: boolean;

  // my-users profile information
  homeAddress?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    email?: string;
  };
  history?: {
    id: string;
    title: string;
    time: string;
    recordedAt: string;
    duration?: string;
    location: Coordinate;
  }[];

}

export interface Notification {
  id: string;
  type:
    | "incident_approved"
    | "vest_disconnected"
    | "incident_status"
    | "low_battery"
    | "walking_started"
    | "walking_ended"
    | "location_paused"
    | "location_enabled"
    | "incident_not_confirmed"
    | "new_incident";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  userId?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
  status: "online" | "offline";
}

export interface HighRiskArea {
  id: string;
  lat: number;
  lng: number;
  label: string;
  createdBy: string;
  createdAt: string;
}

export interface TeamMember {
  name: string;
  role: string;
  avatar: string;
}

export interface Feature {
  icon: string;
  title: string;
  description: string;
}
