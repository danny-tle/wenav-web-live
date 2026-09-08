import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

const projectId = "wenav-rules-test";

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

  // These tests describe the intended security model. They are marked as
  // expected failures until firestore.rules is tightened in the next step.
  test.failing("an unauthenticated visitor cannot read a private incident", async () => {
    await seed("incidents/incident-1", validIncident("user-1"));
    const publicDb = testEnv.unauthenticatedContext().firestore();

    await assertFails(getDoc(doc(publicDb, "incidents/incident-1")));
  });

  test.failing("a user cannot read another user's private incident", async () => {
    await seed("incidents/incident-1", validIncident("user-1"));
    const otherUserDb = testEnv.authenticatedContext("user-2").firestore();

    await assertFails(getDoc(doc(otherUserDb, "incidents/incident-1")));
  });

  test.failing("a user cannot submit a report under another user's UID", async () => {
    const userDb = testEnv.authenticatedContext("user-1").firestore();

    await assertFails(
      setDoc(doc(userDb, "incidents/incident-1"), validIncident("user-2")),
    );
  });

  test.failing("a user cannot create an already-approved report", async () => {
    const userDb = testEnv.authenticatedContext("user-1").firestore();

    await assertFails(
      setDoc(doc(userDb, "incidents/incident-1"), {
        ...validIncident("user-1"),
        status: "approved",
      }),
    );
  });

  test.failing("a user cannot assign themselves the admin role", async () => {
    const userDb = testEnv.authenticatedContext("user-1").firestore();

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

  test.failing("an admin custom claim authorizes incident review", async () => {
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

  test.failing("the public can read sanitized public incidents", async () => {
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
});
