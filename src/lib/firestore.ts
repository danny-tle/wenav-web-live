import {
  collection,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import {
  Incident,
  Coordinate,
  PublicIncident,
  UserProfile,
  HighRiskArea,
  CaregiverLink,
  LinkScopes,
  LiveLocation,
  TrackedUser,
} from "@/lib/types";

// ─── Timestamp helpers ────────────────────────────────────────────────────────

function formatTimestamp(ts: Timestamp | undefined): string {
  if (!ts) return "";
  return ts.toDate().toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
}

function formatTimestampShort(ts: Timestamp | undefined): string {
  if (!ts) return "";
  return ts.toDate().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Incidents ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToIncident(id: string, data: Record<string, any>): Incident {
  return {
    id,
    type: data.type,
    status: data.status,
    location: data.location as Coordinate,
    address: data.address ?? "",
    description: data.description ?? "",
    reportedAt: formatTimestamp(data.reportedAt as Timestamp),
    reportedBy: data.reportedBy ?? "",
    verificationNote: data.verificationNote ?? "",
    lastUpdated: formatTimestampShort(data.lastUpdated as Timestamp),
  };
}

export function subscribeToIncidents(
  callback: (incidents: Incident[]) => void
): () => void {
  const q = query(collection(db, "incidents"), orderBy("reportedAt", "desc"));
  return onSnapshot(q, (snap) => {
    const incidents = snap.docs.map((d) => docToIncident(d.id, d.data()));
    callback(incidents);
  });
}

export function subscribeToUserIncidents(
  userId: string,
  callback: (incidents: Incident[]) => void
): () => void {
  const q = query(
    collection(db, "incidents"),
    where("reportedBy", "==", userId)
  );
  return onSnapshot(q, (snap) => {
    const incidents = snap.docs
      .map((d) => docToIncident(d.id, d.data()))
      .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));
    callback(incidents);
  });
}

// ─── Public Incidents ────────────────────────────────────────────────────────

// Public documents are sanitized by syncPublicIncident in Cloud Functions.
function docToPublicIncident(
  id: string,
  data: Record<string, unknown>,
): PublicIncident {
  return {
    id,
    type: data.type as PublicIncident["type"],
    location: data.location as Coordinate,
    address: typeof data.address === "string" ? data.address : "",
    reportedAt: formatTimestamp(data.reportedAt as Timestamp | undefined),
    lastUpdated: formatTimestampShort(
      data.lastUpdated as Timestamp | undefined,
    ),
  };
}

export function subscribeToPublicIncidents(
  callback: (incidents: PublicIncident[]) => void,
): () => void {
  const q = query(
    collection(db, "publicIncidents"),
    orderBy("reportedAt", "desc"),
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((d) => docToPublicIncident(d.id, d.data())),
      );
    },
    // Without this, a denied or failed listener leaves the map silently empty.
    (error) => {
      console.error("Failed to load public incidents:", error);
      callback([]);
    },
  );
}

export async function updateIncidentStatus(
  id: string,
  status: Incident["status"],
  verificationNote?: string
): Promise<void> {
  const ref = doc(db, "incidents", id);
  const updates: Record<string, unknown> = {
    status,
    lastUpdated: serverTimestamp(),
  };
  if (verificationNote !== undefined) updates.verificationNote = verificationNote;
  await updateDoc(ref, updates);
}

export async function createIncident(
  data: Omit<Incident, "id" | "reportedAt" | "lastUpdated">
): Promise<string> {
  const ref = await addDoc(collection(db, "incidents"), {
    ...data,
    reportedAt: serverTimestamp(),
    lastUpdated: serverTimestamp(),
  });
  return ref.id;
}

// ─── High-Risk Areas ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToHighRiskArea(id: string, data: Record<string, any>): HighRiskArea {
  return {
    id,
    lat: data.lat,
    lng: data.lng,
    label: data.label ?? "",
    createdBy: data.createdBy ?? "",
    createdAt: formatTimestamp(data.createdAt as Timestamp),
  };
}

export function subscribeToHighRiskAreas(
  callback: (areas: HighRiskArea[]) => void
): () => void {
  const q = query(collection(db, "highRiskAreas"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const areas = snap.docs.map((d) => docToHighRiskArea(d.id, d.data()));
    callback(areas);
  });
}

export async function addHighRiskArea(
  data: Omit<HighRiskArea, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "highRiskAreas"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteHighRiskArea(id: string): Promise<void> {
  await deleteDoc(doc(db, "highRiskAreas", id));
}

// ─── User Profiles ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToUserProfile(id: string, data: Record<string, any>): UserProfile {
  return {
    uid: id,
    displayName: data.displayName ?? "Unknown",
    email: data.email ?? "",
    role: data.role ?? "user",
    createdAt: formatTimestamp(data.createdAt as Timestamp),
    status: data.status ?? "offline",
  };
}

export function subscribeToUserProfiles(
  callback: (users: UserProfile[]) => void
): () => void {
  const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const users = snap.docs.map((d) => docToUserProfile(d.id, d.data()));
    callback(users);
  });
}

export async function upsertUserProfile(
  uid: string,
  data: Partial<Omit<UserProfile, "uid" | "createdAt">>
): Promise<void> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, data);
  } else {
    await setDoc(ref, { ...data, createdAt: serverTimestamp() });
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return docToUserProfile(snap.id, snap.data());
}

// ─── Caregiver links and live location ───────────────────────────────────────
//
// A caregiver sees a person only while a link document exists granting it.
// Deleting the link cuts access off on the next read, which is why revoking is
// a plain delete rather than a status flag.

/**
 * Phrases a recorded time the way a caregiver reads it. Location publishing is
 * tied to walks, so a position is usually *not* current — saying "14 min ago"
 * keeps that honest, where a clock time invites reading it as live.
 */
function describeAge(timestampMs: number): string {
  if (!timestampMs) return "never";

  const seconds = Math.round((Date.now() - timestampMs) / 1000);
  if (seconds < 45) return "just now";

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  return new Date(timestampMs).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * How long a position stays trustworthy. Past this, the pin is rendered as
 * offline rather than shown at a stale location — on a safety product,
 * "here 40 minutes ago" presented as "here" is worse than no pin at all.
 */
export const LIVE_LOCATION_STALE_AFTER_MS = 60 * 1000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToLink(id: string, data: Record<string, any>): CaregiverLink {
  return {
    id,
    userId: data.userId ?? "",
    caregiverId: data.caregiverId ?? "",
    userName: data.userName ?? "Unknown",
    caregiverName: data.caregiverName ?? "Unknown",
    scopes: {
      liveLocation: data.scopes?.liveLocation === true,
      incidents: data.scopes?.incidents === true,
      history: data.scopes?.history === true,
    },
    createdAt: formatTimestamp(data.createdAt as Timestamp),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function docToLiveLocation(id: string, data: Record<string, any>): LiveLocation {
  const updatedAt = data.updatedAt as Timestamp | undefined;
  return {
    userId: id,
    location: (data.location as Coordinate) ?? { lat: 0, lng: 0 },
    status: data.status ?? "offline",
    updatedAtMs: updatedAt ? updatedAt.toMillis() : 0,
    vestBattery: data.vestBattery,
    vestConnected: data.vestConnected,
  };
}

/** Links where the signed-in user is the caregiver — the people they watch. */
export function subscribeToMyLinks(
  caregiverId: string,
  callback: (links: CaregiverLink[]) => void
): () => void {
  const q = query(
    collection(db, "links"),
    where("caregiverId", "==", caregiverId)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => docToLink(d.id, d.data())));
  });
}

/** Links where the signed-in user is the one being cared for. */
export function subscribeToMyCaregivers(
  userId: string,
  callback: (links: CaregiverLink[]) => void
): () => void {
  const q = query(collection(db, "links"), where("userId", "==", userId));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => docToLink(d.id, d.data())));
  });
}

export function subscribeToLiveLocation(
  userId: string,
  callback: (location: LiveLocation | null) => void
): () => void {
  return onSnapshot(
    doc(db, "liveLocations", userId),
    (snap) => {
      callback(snap.exists() ? docToLiveLocation(snap.id, snap.data()) : null);
    },
    // A caregiver whose scope was just turned off gets permission-denied here.
    // Treat it as "no location" rather than crashing the dashboard.
    () => callback(null)
  );
}

/**
 * The dashboard feed: every person the signed-in caregiver watches, merged
 * with their live position.
 *
 * Fans out one listener per linked person, and re-fans whenever the set of
 * links changes, so revoking access tears down that person's listener too.
 * Emits `TrackedUser[]` — the same shape the dashboard already renders, so
 * swapping mock data for this needs no component changes.
 */
export function subscribeToTrackedUsers(
  caregiverId: string,
  callback: (users: TrackedUser[]) => void
): () => void {
  const locations = new Map<string, LiveLocation | null>();
  let links: CaregiverLink[] = [];
  const locationUnsubs = new Map<string, () => void>();

  function emit() {
    const now = Date.now();
    callback(
      links.map((link) => {
        const live = locations.get(link.userId) ?? null;
        const stale =
          !live || now - live.updatedAtMs > LIVE_LOCATION_STALE_AFTER_MS;

        return {
          id: link.userId,
          name: link.userName,
          // Stale means "not walking right now", not "position unknown" — the
          // last recorded pin still shows, labelled with its age.
          status: stale ? "offline" : live.status,
          lastLocation: live?.location ?? { lat: 0, lng: 0 },
          hasLocation: !!live?.location,
          lastUpdated: describeAge(live?.updatedAtMs ?? 0),
          route: [],
          vestBattery: live?.vestBattery ?? 0,
          vestConnected: live?.vestConnected ?? false,
        } satisfies TrackedUser;
      })
    );
  }

  const unsubLinks = subscribeToMyLinks(caregiverId, (next) => {
    links = next;
    const wanted = new Set(
      next.filter((l) => l.scopes.liveLocation).map((l) => l.userId)
    );

    // Drop listeners for people no longer linked or no longer sharing.
    Array.from(locationUnsubs.keys()).forEach((userId) => {
      if (!wanted.has(userId)) {
        locationUnsubs.get(userId)?.();
        locationUnsubs.delete(userId);
        locations.delete(userId);
      }
    });

    // Add listeners for newly linked people.
    Array.from(wanted).forEach((userId) => {
      if (locationUnsubs.has(userId)) return;
      locationUnsubs.set(
        userId,
        subscribeToLiveLocation(userId, (loc) => {
          locations.set(userId, loc);
          emit();
        })
      );
    });

    emit();
  });

  return () => {
    unsubLinks();
    Array.from(locationUnsubs.values()).forEach((unsub) => unsub());
    locationUnsubs.clear();
  };
}

/** Ends a relationship. Either party may call this. */
export async function revokeLink(linkId: string): Promise<void> {
  await deleteDoc(doc(db, "links", linkId));
}

/**
 * Changes what one caregiver can see. Only the cared-for user may do this —
 * the rules reject it from the caregiver's side.
 */
export async function updateLinkScopes(
  linkId: string,
  scopes: LinkScopes
): Promise<void> {
  await updateDoc(doc(db, "links", linkId), { scopes });
}

/**
 * Redeems a code read out by the person being cared for, creating the link.
 * Returns their display name for the confirmation screen.
 */
export async function redeemPairingCode(code: string): Promise<string> {
  const call = httpsCallable<{ code: string }, { userName: string }>(
    functions,
    "redeemPairingCode"
  );
  const result = await call({ code });
  return result.data.userName;
}

/**
 * Breadcrumb trail for one person, for drawing today's route.
 *
 * Subscribed only for the person the caregiver currently has selected — one
 * listener, not one per linked user, since only the selected route is drawn.
 */
export function subscribeToUserTrack(
  userId: string,
  callback: (points: Coordinate[]) => void,
  maxPoints = 500
): () => void {
  const q = query(
    collection(db, "liveLocations", userId, "track"),
    orderBy("recordedAt", "desc"),
    limit(maxPoints)
  );
  return onSnapshot(
    q,
    (snap) => {
      const points = snap.docs
        .map((d) => d.data().location as Coordinate)
        .filter((loc): loc is Coordinate => !!loc)
        // Query is newest-first for the limit; the line needs oldest-first.
        .reverse();
      callback(points);
    },
    // Scope revoked mid-walk, or nothing recorded yet.
    () => callback([])
  );
}
