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
}

export interface TrackedUser {
  id: string;
  name: string;
  avatar?: string;
  status: "walking" | "idle" | "offline";
  lastLocation: Coordinate;
  route: Coordinate[];
  vestBattery: number;
  vestConnected: boolean;
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
