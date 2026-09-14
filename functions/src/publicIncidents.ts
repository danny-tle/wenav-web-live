import { FieldValue, type DocumentData, type Firestore } from "firebase-admin/firestore";

/**
 * Mirrors one private incident into `publicIncidents`. Only approved incidents
 * are published, and only the fields the public map needs are copied; reporter
 * identity, descriptions, and administrator notes stay private.
 */
export async function syncPublicIncidentDoc(
  db: Firestore,
  incidentId: string,
  data: DocumentData | undefined,
): Promise<"published" | "removed"> {
  const publicRef = db.collection("publicIncidents").doc(incidentId);

  if (!data || data.status !== "approved") {
    await publicRef.delete();
    return "removed";
  }

  await publicRef.set({
    type: data.type,
    location: data.location,
    address: data.address ?? "",
    reportedAt: data.reportedAt ?? FieldValue.serverTimestamp(),
    lastUpdated: data.lastUpdated ?? FieldValue.serverTimestamp(),
    publishedAt: FieldValue.serverTimestamp(),
  });
  return "published";
}
