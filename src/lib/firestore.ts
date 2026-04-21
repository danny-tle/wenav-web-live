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
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Incident, Coordinate, UserProfile, HighRiskArea } from "@/lib/types";

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
