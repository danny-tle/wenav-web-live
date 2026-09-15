import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

const projectId = "wenav-rules-test";

const validLink = (
  userId: string,
  caregiverId: string,
  scopes: Record<string, boolean> = {
    liveLocation: true,
    incidents: true,
    history: false,
  },
) => ({
  userId,
  caregiverId,
  userName: "Cared For",
  caregiverName: "Care Giver",
  scopes,
  createdAt: serverTimestamp(),
});

const validLiveLocation = () => ({
  location: { lat: 40.7608, lng: -111.891 },
  status: "walking",
  updatedAt: serverTimestamp(),
});

const validIncident = (reportedBy: string) => ({
  type: "blocked_path",
  status: "under_review",
  location: { lat: 40.7608, lng: -111.891 },
  address: "Salt Lake City, Utah",
  description: "Sidewalk is blocked.",
  reportedBy,
  reportedAt: serverTimestamp(),
  lastUpdated: serverTimestamp(),
});

describe("WeNav Firestore security rules", () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId,
      firestore: {
        rules: readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8"),
      },
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  async function seed(path: string, data: Record<string, unknown>) {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), path), data);
    });
  }

  test("verification codes cannot be read by clients", async () => {
    await seed("verificationCodes/user@example.com", { code: "123456" });
    const userDb = testEnv.authenticatedContext("user-1").firestore();

    await assertFails(
      getDoc(doc(userDb, "verificationCodes/user@example.com")),
    );
  });

  test("a signed-in user can submit a valid report for themselves", async () => {
    const userDb = testEnv.authenticatedContext("user-1").firestore();

    await assertSucceeds(
      setDoc(doc(userDb, "incidents/incident-1"), validIncident("user-1")),
    );
  });

  test("a user can read their own private incident", async () => {
    await seed("incidents/incident-1", validIncident("user-1"));
    const userDb = testEnv.authenticatedContext("user-1").firestore();

    await assertSucceeds(getDoc(doc(userDb, "incidents/incident-1")));
  });

  test("a user can query only their own incidents", async () => {
    await seed("incidents/incident-1", validIncident("user-1"));
    await seed("incidents/incident-2", validIncident("user-2"));
    const userDb = testEnv.authenticatedContext("user-1").firestore();
    const ownReports = query(
      collection(userDb, "incidents"),
      where("reportedBy", "==", "user-1"),
    );

    const result = await assertSucceeds(getDocs(ownReports));
    expect(result.docs).toHaveLength(1);
    expect(result.docs[0].id).toBe("incident-1");
  });

  test("a user cannot query the complete private incident collection", async () => {
    await seed("incidents/incident-1", validIncident("user-1"));
    const userDb = testEnv.authenticatedContext("user-1").firestore();

    await assertFails(getDocs(collection(userDb, "incidents")));
  });

  test("an unauthenticated visitor cannot read a private incident", async () => {
    await seed("incidents/incident-1", validIncident("user-1"));
    const publicDb = testEnv.unauthenticatedContext().firestore();

    await assertFails(getDoc(doc(publicDb, "incidents/incident-1")));
  });

  test("a user cannot read another user's private incident", async () => {
    await seed("incidents/incident-1", validIncident("user-1"));
    const otherUserDb = testEnv.authenticatedContext("user-2").firestore();

    await assertFails(getDoc(doc(otherUserDb, "incidents/incident-1")));
  });

  test("a user cannot submit a report under another user's UID", async () => {
    const userDb = testEnv.authenticatedContext("user-1").firestore();

    await assertFails(
      setDoc(doc(userDb, "incidents/incident-1"), validIncident("user-2")),
    );
  });

  test("a user cannot create an already-approved report", async () => {
    const userDb = testEnv.authenticatedContext("user-1").firestore();

    await assertFails(
      setDoc(doc(userDb, "incidents/incident-1"), {
        ...validIncident("user-1"),
        status: "approved",
      }),
    );
  });

  test("a user cannot submit an unknown incident type", async () => {
    const userDb = testEnv.authenticatedContext("user-1").firestore();

    await assertFails(
      setDoc(doc(userDb, "incidents/incident-1"), {
        ...validIncident("user-1"),
        type: "made_up_type",
      }),
    );
  });

  test("a user cannot submit coordinates outside valid GPS bounds", async () => {
    const userDb = testEnv.authenticatedContext("user-1").firestore();

    await assertFails(
      setDoc(doc(userDb, "incidents/incident-1"), {
        ...validIncident("user-1"),
        location: { lat: 120, lng: -111.891 },
      }),
    );
  });

  test("a user cannot submit unexpected incident fields", async () => {
    const userDb = testEnv.authenticatedContext("user-1").firestore();

    await assertFails(
      setDoc(doc(userDb, "incidents/incident-1"), {
        ...validIncident("user-1"),
        internalAdminNote: "client-controlled value",
      }),
    );
  });

  test("a user cannot update their report's review status", async () => {
    await seed("incidents/incident-1", validIncident("user-1"));
    const userDb = testEnv.authenticatedContext("user-1").firestore();

    await assertFails(
      updateDoc(doc(userDb, "incidents/incident-1"), {
        status: "approved",
        lastUpdated: serverTimestamp(),
      }),
    );
  });

  test("a user can create their own non-admin profile", async () => {
    const userDb = testEnv
      .authenticatedContext("user-1", { email: "user@example.com" })
      .firestore();

    await assertSucceeds(
      setDoc(doc(userDb, "users/user-1"), {
        displayName: "User One",
        email: "user@example.com",
        role: "user",
        status: "offline",
        createdAt: serverTimestamp(),
      }),
    );
  });

  test("a user cannot assign themselves the admin role", async () => {
    const userDb = testEnv
      .authenticatedContext("user-1", { email: "user@example.com" })
      .firestore();

    await assertFails(
      setDoc(doc(userDb, "users/user-1"), {
        displayName: "User One",
        email: "user@example.com",
        role: "admin",
        status: "offline",
        createdAt: serverTimestamp(),
      }),
    );
  });

  test("a user can update safe fields on their own profile", async () => {
    await seed("users/user-1", {
      displayName: "Old Name",
      email: "user@example.com",
      role: "user",
      status: "offline",
      createdAt: serverTimestamp(),
    });
    const userDb = testEnv
      .authenticatedContext("user-1", { email: "user@example.com" })
      .firestore();

    await assertSucceeds(
      updateDoc(doc(userDb, "users/user-1"), {
        displayName: "New Name",
        status: "online",
      }),
    );
  });

  test("a user cannot alter protected profile fields", async () => {
    await seed("users/user-1", {
      displayName: "User One",
      email: "user@example.com",
      role: "user",
      status: "offline",
      createdAt: serverTimestamp(),
    });
    const userDb = testEnv
      .authenticatedContext("user-1", { email: "user@example.com" })
      .firestore();

    await assertFails(
      updateDoc(doc(userDb, "users/user-1"), { role: "admin" }),
    );
    await assertFails(
      updateDoc(doc(userDb, "users/user-1"), { email: "other@example.com" }),
    );
  });

  test("a user cannot read another user's profile", async () => {
    await seed("users/user-2", {
      displayName: "User Two",
      email: "user2@example.com",
      role: "user",
      status: "offline",
      createdAt: serverTimestamp(),
    });
    const userDb = testEnv
      .authenticatedContext("user-1", { email: "user@example.com" })
      .firestore();

    await assertFails(getDoc(doc(userDb, "users/user-2")));
  });

  test("an admin can list user profiles", async () => {
    await seed("users/user-1", {
      displayName: "User One",
      email: "user@example.com",
      role: "user",
      status: "offline",
      createdAt: serverTimestamp(),
    });
    const adminDb = testEnv
      .authenticatedContext("admin-1", {
        admin: true,
        email: "admin@example.com",
      })
      .firestore();

    const result = await assertSucceeds(getDocs(collection(adminDb, "users")));
    expect(result.docs).toHaveLength(1);
  });

  test("only an admin claim can write high-risk areas", async () => {
    const emailOnlyDb = testEnv
      .authenticatedContext("email-admin", { email: "wenavapp@gmail.com" })
      .firestore();
    const adminDb = testEnv
      .authenticatedContext("admin-1", { admin: true })
      .firestore();
    const area = {
      lat: 40.7608,
      lng: -111.891,
      label: "Construction zone",
      createdBy: "admin-1",
      createdAt: serverTimestamp(),
    };

    await assertFails(
      setDoc(doc(emailOnlyDb, "highRiskAreas/area-1"), area),
    );
    await assertSucceeds(
      setDoc(doc(adminDb, "highRiskAreas/area-1"), area),
    );
  });

  test("an admin custom claim authorizes incident review", async () => {
    await seed("incidents/incident-1", validIncident("user-1"));
    const adminDb = testEnv
      .authenticatedContext("admin-1", { admin: true })
      .firestore();

    await assertSucceeds(
      updateDoc(doc(adminDb, "incidents/incident-1"), {
        status: "approved",
        lastUpdated: serverTimestamp(),
      }),
    );
  });

  test("an admin can query all private incidents", async () => {
    await seed("incidents/incident-1", validIncident("user-1"));
    await seed("incidents/incident-2", validIncident("user-2"));
    const adminDb = testEnv
      .authenticatedContext("admin-1", { admin: true })
      .firestore();

    const result = await assertSucceeds(
      getDocs(collection(adminDb, "incidents")),
    );
    expect(result.docs).toHaveLength(2);
  });

  test("an admin cannot alter incident ownership during review", async () => {
    await seed("incidents/incident-1", validIncident("user-1"));
    const adminDb = testEnv
      .authenticatedContext("admin-1", { admin: true })
      .firestore();

    await assertFails(
      updateDoc(doc(adminDb, "incidents/incident-1"), {
        reportedBy: "admin-1",
        status: "approved",
        lastUpdated: serverTimestamp(),
      }),
    );
  });

  test("an admin can create an approved incident for the map", async () => {
    const adminDb = testEnv
      .authenticatedContext("admin-1", { admin: true })
      .firestore();

    await assertSucceeds(
      setDoc(doc(adminDb, "incidents/incident-1"), {
        ...validIncident("admin-1"),
        status: "approved",
      }),
    );
  });

  test("an admin email without the custom claim has no admin access", async () => {
    await seed("incidents/incident-1", validIncident("user-1"));
    const emailOnlyDb = testEnv
      .authenticatedContext("email-admin", { email: "wenavapp@gmail.com" })
      .firestore();

    await assertFails(
      updateDoc(doc(emailOnlyDb, "incidents/incident-1"), {
        status: "approved",
        lastUpdated: serverTimestamp(),
      }),
    );
  });

  test("the public can read sanitized public incidents", async () => {
    await seed("publicIncidents/incident-1", {
      type: "blocked_path",
      location: { lat: 40.7608, lng: -111.891 },
      address: "Salt Lake City, Utah",
      publishedAt: serverTimestamp(),
    });
    const publicDb = testEnv.unauthenticatedContext().firestore();

    await assertSucceeds(
      getDoc(doc(publicDb, "publicIncidents/incident-1")),
    );
  });

  test("clients cannot write directly to public incidents", async () => {
    const adminDb = testEnv
      .authenticatedContext("admin-1", { admin: true })
      .firestore();

    await assertFails(
      setDoc(doc(adminDb, "publicIncidents/incident-1"), {
        type: "blocked_path",
        location: { lat: 40.7608, lng: -111.891 },
      }),
    );
  });

  // ─── Caregiver links ───────────────────────────────────────────────────────

  test("clients cannot forge a caregiver link", async () => {
    const caregiverDb = testEnv.authenticatedContext("caregiver-1").firestore();

    await assertFails(
      setDoc(
        doc(caregiverDb, "links/user-1_caregiver-1"),
        validLink("user-1", "caregiver-1"),
      ),
    );
  });

  test("both parties can read their own link, outsiders cannot", async () => {
    await seed("links/user-1_caregiver-1", validLink("user-1", "caregiver-1"));

    const userDb = testEnv.authenticatedContext("user-1").firestore();
    const caregiverDb = testEnv.authenticatedContext("caregiver-1").firestore();
    const strangerDb = testEnv.authenticatedContext("user-2").firestore();

    await assertSucceeds(getDoc(doc(userDb, "links/user-1_caregiver-1")));
    await assertSucceeds(getDoc(doc(caregiverDb, "links/user-1_caregiver-1")));
    await assertFails(getDoc(doc(strangerDb, "links/user-1_caregiver-1")));
  });

  test("the cared-for user can narrow scopes; the caregiver cannot widen them", async () => {
    await seed(
      "links/user-1_caregiver-1",
      validLink("user-1", "caregiver-1", {
        liveLocation: true,
        incidents: true,
        history: false,
      }),
    );

    const userDb = testEnv.authenticatedContext("user-1").firestore();
    const caregiverDb = testEnv.authenticatedContext("caregiver-1").firestore();

    await assertSucceeds(
      updateDoc(doc(userDb, "links/user-1_caregiver-1"), {
        scopes: { liveLocation: false, incidents: true, history: false },
      }),
    );

    await assertFails(
      updateDoc(doc(caregiverDb, "links/user-1_caregiver-1"), {
        scopes: { liveLocation: true, incidents: true, history: true },
      }),
    );
  });

  test("either party can revoke the link", async () => {
    await seed("links/user-1_caregiver-1", validLink("user-1", "caregiver-1"));
    const userDb = testEnv.authenticatedContext("user-1").firestore();
    await assertSucceeds(deleteDoc(doc(userDb, "links/user-1_caregiver-1")));

    await seed("links/user-2_caregiver-2", validLink("user-2", "caregiver-2"));
    const caregiverDb = testEnv.authenticatedContext("caregiver-2").firestore();
    await assertSucceeds(
      deleteDoc(doc(caregiverDb, "links/user-2_caregiver-2")),
    );
  });

  // ─── Live location ─────────────────────────────────────────────────────────

  test("a user can publish their own live location", async () => {
    const userDb = testEnv.authenticatedContext("user-1").firestore();

    await assertSucceeds(
      setDoc(doc(userDb, "liveLocations/user-1"), validLiveLocation()),
    );
  });

  test("a user cannot publish someone else's live location", async () => {
    const userDb = testEnv.authenticatedContext("user-2").firestore();

    await assertFails(
      setDoc(doc(userDb, "liveLocations/user-1"), validLiveLocation()),
    );
  });

  test("a linked caregiver can read live location when the scope is granted", async () => {
    await seed("links/user-1_caregiver-1", validLink("user-1", "caregiver-1"));
    await seed("liveLocations/user-1", {
      location: { lat: 40.7608, lng: -111.891 },
      status: "walking",
      updatedAt: new Date(),
    });

    const caregiverDb = testEnv.authenticatedContext("caregiver-1").firestore();

    await assertSucceeds(getDoc(doc(caregiverDb, "liveLocations/user-1")));
  });

  test("a caregiver cannot read live location once the scope is turned off", async () => {
    await seed(
      "links/user-1_caregiver-1",
      validLink("user-1", "caregiver-1", {
        liveLocation: false,
        incidents: true,
        history: false,
      }),
    );
    await seed("liveLocations/user-1", {
      location: { lat: 40.7608, lng: -111.891 },
      status: "walking",
      updatedAt: new Date(),
    });

    const caregiverDb = testEnv.authenticatedContext("caregiver-1").firestore();

    await assertFails(getDoc(doc(caregiverDb, "liveLocations/user-1")));
  });

  test("an unlinked user cannot read someone's live location", async () => {
    await seed("liveLocations/user-1", {
      location: { lat: 40.7608, lng: -111.891 },
      status: "walking",
      updatedAt: new Date(),
    });

    const strangerDb = testEnv.authenticatedContext("user-2").firestore();

    await assertFails(getDoc(doc(strangerDb, "liveLocations/user-1")));
  });

  test("revoking the link immediately cuts off live location", async () => {
    await seed("links/user-1_caregiver-1", validLink("user-1", "caregiver-1"));
    await seed("liveLocations/user-1", {
      location: { lat: 40.7608, lng: -111.891 },
      status: "walking",
      updatedAt: new Date(),
    });

    const userDb = testEnv.authenticatedContext("user-1").firestore();
    const caregiverDb = testEnv.authenticatedContext("caregiver-1").firestore();

    await assertSucceeds(getDoc(doc(caregiverDb, "liveLocations/user-1")));
    await assertSucceeds(deleteDoc(doc(userDb, "links/user-1_caregiver-1")));
    await assertFails(getDoc(doc(caregiverDb, "liveLocations/user-1")));
  });

  // ─── Pairing codes ─────────────────────────────────────────────────────────

  test("pairing codes are invisible to every client", async () => {
    await seed("pairingCodes/ABC234", {
      userId: "user-1",
      expiresAt: new Date(Date.now() + 600000),
    });

    const userDb = testEnv.authenticatedContext("user-1").firestore();
    const adminDb = testEnv
      .authenticatedContext("admin-1", { admin: true })
      .firestore();

    await assertFails(getDoc(doc(userDb, "pairingCodes/ABC234")));
    await assertFails(getDoc(doc(adminDb, "pairingCodes/ABC234")));
  });
});
