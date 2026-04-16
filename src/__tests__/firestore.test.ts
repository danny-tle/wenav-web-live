/**
 * Unit tests for src/lib/firestore.ts
 *
 * All Firebase SDK calls are mocked so tests run without a real project.
 */

// ─── Firebase mocks ───────────────────────────────────────────────────────────

// jest.mock is hoisted before variable declarations, so the firebase mock
// uses a literal object. Tests assert on collection/doc names, not the db ref.
jest.mock("@/lib/firebase", () => ({ db: {} }));

// Capture mutable references so individual tests can swap return values.
const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockOnSnapshot = jest.fn();
const mockCollection = jest.fn((...args: unknown[]) => ({ path: args[1] }));
const mockDoc = jest.fn((...args: unknown[]) => ({ path: args[1], id: args[2] }));
const mockQuery = jest.fn((...args: unknown[]) => args[0]);
const mockOrderBy = jest.fn();
const mockServerTimestamp = jest.fn(() => "__SERVER_TS__");

jest.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  serverTimestamp: () => mockServerTimestamp(),
  // Fake Timestamp: toDate() converts the stored ISO string to a Date.
  Timestamp: class {
    constructor(public readonly isoString: string) {}
    toDate() { return new Date(this.isoString); }
  },
}));

// ─── Subject under test ───────────────────────────────────────────────────────

import {
  subscribeToIncidents,
  updateIncidentStatus,
  createIncident,
  subscribeToHighRiskAreas,
  addHighRiskArea,
  deleteHighRiskArea,
  subscribeToUserProfiles,
  upsertUserProfile,
  getUserProfile,
} from "@/lib/firestore";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a fake Firestore snapshot from an array of { id, data } pairs. */
function makeSnap(docs: { id: string; data: Record<string, unknown> }[]) {
  return {
    docs: docs.map((d) => ({ id: d.id, data: () => d.data })),
  };
}

/** Build a fake Timestamp-shaped object from an ISO string. */
function ts(iso: string) {
  return { toDate: () => new Date(iso) };
}

beforeEach(() => {
  jest.clearAllMocks();
  // Default: onSnapshot immediately calls the callback with an empty snapshot.
  mockOnSnapshot.mockImplementation((_q: unknown, cb: (snap: unknown) => void) => {
    cb(makeSnap([]));
    return jest.fn(); // unsubscribe no-op
  });
});

// ─── subscribeToIncidents ─────────────────────────────────────────────────────

describe("subscribeToIncidents", () => {
  it("returns an unsubscribe function", () => {
    const unsub = jest.fn();
    mockOnSnapshot.mockReturnValue(unsub);
    const result = subscribeToIncidents(jest.fn());
    expect(result).toBe(unsub);
  });

  it("queries the 'incidents' collection ordered by reportedAt desc", () => {
    subscribeToIncidents(jest.fn());
    expect(mockCollection).toHaveBeenCalledWith(expect.anything(), "incidents");
    expect(mockOrderBy).toHaveBeenCalledWith("reportedAt", "desc");
  });

  it("maps Firestore docs to Incident objects", () => {
    const callback = jest.fn();
    mockOnSnapshot.mockImplementation((_q: unknown, cb: (snap: unknown) => void) => {
      cb(
        makeSnap([
          {
            id: "inc1",
            data: {
              type: "blocked_path",
              status: "under_review",
              location: { lat: 40.7, lng: -111.9 },
              address: "123 Main St",
              description: "Big pothole",
              reportedAt: ts("2024-01-15T10:30:00Z"),
              reportedBy: "user123",
              verificationNote: "Needs inspection",
              lastUpdated: ts("2024-01-16T00:00:00Z"),
            },
          },
        ])
      );
      return jest.fn();
    });

    subscribeToIncidents(callback);

    expect(callback).toHaveBeenCalledTimes(1);
    const [incidents] = callback.mock.calls[0];
    expect(incidents).toHaveLength(1);
    const inc = incidents[0];
    expect(inc.id).toBe("inc1");
    expect(inc.type).toBe("blocked_path");
    expect(inc.status).toBe("under_review");
    expect(inc.location).toEqual({ lat: 40.7, lng: -111.9 });
    expect(inc.address).toBe("123 Main St");
    expect(inc.description).toBe("Big pothole");
    expect(inc.reportedBy).toBe("user123");
    expect(inc.verificationNote).toBe("Needs inspection");
    // Formatted strings should be non-empty (exact format tested separately)
    expect(inc.reportedAt).toBeTruthy();
    expect(inc.lastUpdated).toBeTruthy();
  });

  it("fills optional fields with defaults when missing from doc", () => {
    const callback = jest.fn();
    mockOnSnapshot.mockImplementation((_q: unknown, cb: (snap: unknown) => void) => {
      cb(
        makeSnap([
          {
            id: "inc2",
            data: {
              type: "other",
              status: "not_confirmed",
              location: { lat: 0, lng: 0 },
            },
          },
        ])
      );
      return jest.fn();
    });

    subscribeToIncidents(callback);

    const [incidents] = callback.mock.calls[0];
    const inc = incidents[0];
    expect(inc.address).toBe("");
    expect(inc.description).toBe("");
    expect(inc.reportedBy).toBe("");
    expect(inc.verificationNote).toBe("");
    expect(inc.reportedAt).toBe("");
    expect(inc.lastUpdated).toBe("");
  });

  it("delivers an empty array when the collection is empty", () => {
    const callback = jest.fn();
    subscribeToIncidents(callback);
    expect(callback).toHaveBeenCalledWith([]);
  });

  it("delivers multiple incidents in snapshot order", () => {
    const callback = jest.fn();
    mockOnSnapshot.mockImplementation((_q: unknown, cb: (snap: unknown) => void) => {
      cb(
        makeSnap([
          { id: "a", data: { type: "construction", status: "approved", location: { lat: 1, lng: 1 } } },
          { id: "b", data: { type: "other", status: "not_confirmed", location: { lat: 2, lng: 2 } } },
        ])
      );
      return jest.fn();
    });

    subscribeToIncidents(callback);
    const [incidents] = callback.mock.calls[0];
    expect(incidents.map((i: { id: string }) => i.id)).toEqual(["a", "b"]);
  });
});

// ─── updateIncidentStatus ─────────────────────────────────────────────────────

describe("updateIncidentStatus", () => {
  it("calls updateDoc with status and serverTimestamp", async () => {
    mockUpdateDoc.mockResolvedValue(undefined);
    await updateIncidentStatus("inc1", "approved");

    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), "incidents", "inc1");
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: "approved",
        lastUpdated: "__SERVER_TS__",
      })
    );
  });

  it("includes verificationNote when provided", async () => {
    mockUpdateDoc.mockResolvedValue(undefined);
    await updateIncidentStatus("inc1", "not_confirmed", "No evidence found");

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ verificationNote: "No evidence found" })
    );
  });

  it("omits verificationNote when not provided", async () => {
    mockUpdateDoc.mockResolvedValue(undefined);
    await updateIncidentStatus("inc1", "under_review");

    const updateArg = mockUpdateDoc.mock.calls[0][1];
    expect(updateArg).not.toHaveProperty("verificationNote");
  });
});

// ─── createIncident ───────────────────────────────────────────────────────────

describe("createIncident", () => {
  it("adds a document to the 'incidents' collection and returns its id", async () => {
    mockAddDoc.mockResolvedValue({ id: "new-inc-id" });

    const id = await createIncident({
      type: "uneven_sidewalk",
      status: "under_review",
      location: { lat: 40.7, lng: -111.9 },
      address: "456 Oak Ave",
      description: "Cracked pavement",
      reportedBy: "userABC",
    });

    expect(mockCollection).toHaveBeenCalledWith(expect.anything(), "incidents");
    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: "uneven_sidewalk",
        status: "under_review",
        reportedAt: "__SERVER_TS__",
        lastUpdated: "__SERVER_TS__",
      })
    );
    expect(id).toBe("new-inc-id");
  });
});

// ─── subscribeToHighRiskAreas ─────────────────────────────────────────────────

describe("subscribeToHighRiskAreas", () => {
  it("queries the 'highRiskAreas' collection ordered by createdAt desc", () => {
    subscribeToHighRiskAreas(jest.fn());
    expect(mockCollection).toHaveBeenCalledWith(expect.anything(), "highRiskAreas");
    expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "desc");
  });

  it("maps docs to HighRiskArea objects", () => {
    const callback = jest.fn();
    mockOnSnapshot.mockImplementation((_q: unknown, cb: (snap: unknown) => void) => {
      cb(
        makeSnap([
          {
            id: "area1",
            data: {
              lat: 40.5,
              lng: -111.8,
              label: "Broken curb",
              createdBy: "admin",
              createdAt: ts("2024-03-01T08:00:00Z"),
            },
          },
        ])
      );
      return jest.fn();
    });

    subscribeToHighRiskAreas(callback);

    const [areas] = callback.mock.calls[0];
    expect(areas).toHaveLength(1);
    expect(areas[0].id).toBe("area1");
    expect(areas[0].lat).toBe(40.5);
    expect(areas[0].lng).toBe(-111.8);
    expect(areas[0].label).toBe("Broken curb");
    expect(areas[0].createdBy).toBe("admin");
    expect(areas[0].createdAt).toBeTruthy();
  });

  it("fills defaults for missing optional fields", () => {
    const callback = jest.fn();
    mockOnSnapshot.mockImplementation((_q: unknown, cb: (snap: unknown) => void) => {
      cb(makeSnap([{ id: "area2", data: { lat: 1, lng: 2 } }]));
      return jest.fn();
    });

    subscribeToHighRiskAreas(callback);
    const area = callback.mock.calls[0][0][0];
    expect(area.label).toBe("");
    expect(area.createdBy).toBe("");
    expect(area.createdAt).toBe("");
  });
});

// ─── addHighRiskArea ──────────────────────────────────────────────────────────

describe("addHighRiskArea", () => {
  it("adds to 'highRiskAreas' with a serverTimestamp and returns the id", async () => {
    mockAddDoc.mockResolvedValue({ id: "area-xyz" });

    const id = await addHighRiskArea({ lat: 40.7, lng: -111.9, label: "Steep ramp", createdBy: "admin" });

    expect(mockCollection).toHaveBeenCalledWith(expect.anything(), "highRiskAreas");
    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        lat: 40.7,
        lng: -111.9,
        label: "Steep ramp",
        createdBy: "admin",
        createdAt: "__SERVER_TS__",
      })
    );
    expect(id).toBe("area-xyz");
  });
});

// ─── deleteHighRiskArea ───────────────────────────────────────────────────────

describe("deleteHighRiskArea", () => {
  it("calls deleteDoc on the correct document reference", async () => {
    mockDeleteDoc.mockResolvedValue(undefined);

    await deleteHighRiskArea("area-to-delete");

    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), "highRiskAreas", "area-to-delete");
    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
  });
});

// ─── subscribeToUserProfiles ──────────────────────────────────────────────────

describe("subscribeToUserProfiles", () => {
  it("queries the 'users' collection ordered by createdAt desc", () => {
    subscribeToUserProfiles(jest.fn());
    expect(mockCollection).toHaveBeenCalledWith(expect.anything(), "users");
    expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "desc");
  });

  it("maps docs to UserProfile objects", () => {
    const callback = jest.fn();
    mockOnSnapshot.mockImplementation((_q: unknown, cb: (snap: unknown) => void) => {
      cb(
        makeSnap([
          {
            id: "uid1",
            data: {
              displayName: "Alice",
              email: "alice@example.com",
              role: "admin",
              status: "online",
              createdAt: ts("2024-02-10T12:00:00Z"),
            },
          },
        ])
      );
      return jest.fn();
    });

    subscribeToUserProfiles(callback);

    const [users] = callback.mock.calls[0];
    expect(users).toHaveLength(1);
    const u = users[0];
    expect(u.uid).toBe("uid1");
    expect(u.displayName).toBe("Alice");
    expect(u.email).toBe("alice@example.com");
    expect(u.role).toBe("admin");
    expect(u.status).toBe("online");
    expect(u.createdAt).toBeTruthy();
  });

  it("fills defaults for missing optional fields", () => {
    const callback = jest.fn();
    mockOnSnapshot.mockImplementation((_q: unknown, cb: (snap: unknown) => void) => {
      cb(makeSnap([{ id: "uid2", data: {} }]));
      return jest.fn();
    });

    subscribeToUserProfiles(callback);
    const u = callback.mock.calls[0][0][0];
    expect(u.displayName).toBe("Unknown");
    expect(u.email).toBe("");
    expect(u.role).toBe("user");
    expect(u.status).toBe("offline");
  });
});

// ─── upsertUserProfile ────────────────────────────────────────────────────────

describe("upsertUserProfile", () => {
  it("calls updateDoc when the document already exists", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => true });
    mockUpdateDoc.mockResolvedValue(undefined);

    await upsertUserProfile("uid1", { displayName: "Bob", status: "online" });

    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), "users", "uid1");
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      { displayName: "Bob", status: "online" }
    );
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it("calls setDoc with createdAt when the document does not exist", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSetDoc.mockResolvedValue(undefined);

    await upsertUserProfile("uid2", { displayName: "Carol", role: "user" });

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        displayName: "Carol",
        role: "user",
        createdAt: "__SERVER_TS__",
      })
    );
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });
});

// ─── getUserProfile ───────────────────────────────────────────────────────────

describe("getUserProfile", () => {
  it("returns null when the document does not exist", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    const result = await getUserProfile("no-such-uid");

    expect(result).toBeNull();
  });

  it("returns a UserProfile when the document exists", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: "uid3",
      data: () => ({
        displayName: "Dave",
        email: "dave@example.com",
        role: "user",
        status: "offline",
        createdAt: ts("2024-04-01T09:00:00Z"),
      }),
    });

    const profile = await getUserProfile("uid3");

    expect(profile).not.toBeNull();
    expect(profile!.uid).toBe("uid3");
    expect(profile!.displayName).toBe("Dave");
    expect(profile!.email).toBe("dave@example.com");
    expect(profile!.role).toBe("user");
    expect(profile!.status).toBe("offline");
    expect(profile!.createdAt).toBeTruthy();
  });

  it("reads from the correct document reference", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    await getUserProfile("uid-check");

    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), "users", "uid-check");
  });
});
