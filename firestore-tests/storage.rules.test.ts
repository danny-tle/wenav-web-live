import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  deleteObject,
  getBytes,
  ref,
  uploadBytes,
} from "firebase/storage";

const projectId = "wenav-rules-test";
const path = "incidentMedia/user-1/incident-1/0.jpg";
const jpeg = { contentType: "image/jpeg" };
const bytes = (n: number) => new Uint8Array(n);

describe("WeNav Storage security rules", () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId,
      storage: {
        rules: readFileSync(resolve(process.cwd(), "storage.rules"), "utf8"),
      },
    });
  });

  beforeEach(async () => {
    await testEnv.clearStorage();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  async function seed() {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await uploadBytes(ref(ctx.storage(), path), bytes(10), jpeg);
    });
  }

  test("a user can upload a photo to their own folder", async () => {
    const storage = testEnv.authenticatedContext("user-1").storage();
    await assertSucceeds(uploadBytes(ref(storage, path), bytes(10), jpeg));
  });

  test("a user cannot upload into another user's folder", async () => {
    const storage = testEnv.authenticatedContext("user-2").storage();
    await assertFails(uploadBytes(ref(storage, path), bytes(10), jpeg));
  });

  test("uploads must be an allowed image or video type", async () => {
    const storage = testEnv.authenticatedContext("user-1").storage();
    await assertFails(
      uploadBytes(ref(storage, path), bytes(10), { contentType: "text/html" }),
    );
    await assertSucceeds(
      uploadBytes(ref(storage, "incidentMedia/user-1/incident-1/1.mov"), bytes(10), {
        contentType: "video/quicktime",
      }),
    );
  });

  test("photos over 10 MB are refused", async () => {
    const storage = testEnv.authenticatedContext("user-1").storage();
    await assertFails(
      uploadBytes(ref(storage, path), bytes(10 * 1024 * 1024), jpeg),
    );
  });

  test("an uploaded file cannot be overwritten", async () => {
    await seed();
    const storage = testEnv.authenticatedContext("user-1").storage();
    await assertFails(uploadBytes(ref(storage, path), bytes(5), jpeg));
  });

  test("the reporter and admins can read; others cannot", async () => {
    await seed();
    const owner = testEnv.authenticatedContext("user-1").storage();
    const admin = testEnv
      .authenticatedContext("admin-1", { admin: true })
      .storage();
    const other = testEnv.authenticatedContext("user-2").storage();
    const anon = testEnv.unauthenticatedContext().storage();

    await assertSucceeds(getBytes(ref(owner, path)));
    await assertSucceeds(getBytes(ref(admin, path)));
    await assertFails(getBytes(ref(other, path)));
    await assertFails(getBytes(ref(anon, path)));
  });

  test("the reporter can delete their own upload; others cannot", async () => {
    await seed();
    const other = testEnv.authenticatedContext("user-2").storage();
    await assertFails(deleteObject(ref(other, path)));
    const owner = testEnv.authenticatedContext("user-1").storage();
    await assertSucceeds(deleteObject(ref(owner, path)));
  });
});
