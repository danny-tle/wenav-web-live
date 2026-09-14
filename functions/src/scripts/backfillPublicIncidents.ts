/**
 * One-off backfill for `publicIncidents`.
 *
 * syncPublicIncident only runs when an incident is written, so incidents that
 * were approved before it was deployed never reached the public map. By
 * default this only publishes approved incidents; pass --prune to also delete
 * public docs that are no longer approved or whose source incident is gone.
 *
 * Run from functions/ with credentials for the wenav-b1604 project:
 *
 *   npm run build && GOOGLE_APPLICATION_CREDENTIALS=~/keys/wenav-sa.json \
 *     GOOGLE_CLOUD_PROJECT=wenav-b1604 node lib/scripts/backfillPublicIncidents.js [--prune]
 */
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { syncPublicIncidentDoc } from "../publicIncidents.js";

async function main() {
  const prune = process.argv.includes("--prune");
  initializeApp();
  const db = getFirestore();

  const incidents = await db.collection("incidents").get();
  let published = 0;
  let skipped = 0;
  for (const incident of incidents.docs) {
    const data = incident.data();
    if (data.status !== "approved" && !prune) {
      skipped++;
      continue;
    }
    const result = await syncPublicIncidentDoc(db, incident.id, data);
    if (result === "published") published++;
    else skipped++;
  }

  let orphans = 0;
  if (prune) {
    const incidentIds = new Set(incidents.docs.map((d) => d.id));
    const publicDocs = await db.collection("publicIncidents").get();
    for (const publicDoc of publicDocs.docs) {
      if (!incidentIds.has(publicDoc.id)) {
        await publicDoc.ref.delete();
        orphans++;
      }
    }
  }

  console.log(
    `Published ${published}, skipped ${skipped} non-approved` +
      (prune ? `, deleted ${orphans} orphaned public incidents.` : "."),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
