import React from "react";
import {
  render,
  screen,
  within,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminDashboardMap from "@/components/admin/AdminDashboardMap";
import { Incident, UserProfile } from "@/lib/types";

// maplibre-gl is ESM-only (no CJS entry point), so Jest can't resolve it via
// require() at all — `virtual: true` tells Jest not to try, since we're
// replacing it with a no-op stub anyway (it calls browser WebGL APIs that
// don't exist in the Jest DOM environment).
jest.mock("maplibre-gl", () => ({}), { virtual: true });

// Camera methods the map exposes through its ref, so tests can assert on
// fly-in behavior. Named `mock*` so Jest allows them inside the hoisted
// jest.mock factory below.
const mockFlyTo = jest.fn();
const mockEaseTo = jest.fn();
const mockJumpTo = jest.fn();

// react-map-gl wraps maplibre-gl and also needs a real browser. Each
// component is replaced with a plain HTML element so React can still render
// the component tree and we can assert on the UI around the map. Marker and
// Popup are siblings (not nested) in react-map-gl, matching how the real
// component wires marker clicks to popup state.
jest.mock("react-map-gl/maplibre", () => {
  const ReactActual = jest.requireActual("react");
  return {
    Map: ReactActual.forwardRef(
      (
        {
          children,
          onClick,
        }: { children?: React.ReactNode; onClick?: (e: unknown) => void },
        ref: React.Ref<{ flyTo: (opts: unknown) => void }>
      ) => {
        ReactActual.useImperativeHandle(ref, () => ({
          flyTo: mockFlyTo,
          easeTo: mockEaseTo,
          jumpTo: mockJumpTo,
          // useMapCamera registers a one-shot moveend to clear its animating
          // guard; invoke it immediately so the guard doesn't stay latched.
          once: (_event: string, cb: () => void) => cb(),
          getZoom: () => 13,
          getPitch: () => 0,
        }));
        // Real maplibre-gl binds the map's click handler to the canvas
        // element specifically; markers/popups render as separate sibling
        // overlays, so clicking one never bubbles into a map click. Mirror
        // that split here instead of nesting everything under one handler.
        return (
          <div data-testid="map-root">
            <div
              data-testid="map-container"
              onClick={() =>
                onClick?.({ lngLat: { lat: 40.7608, lng: -111.891 } })
              }
            />
            {children}
          </div>
        );
      }
    ),
    NavigationControl: () => <div data-testid="navigation-control" />,
    Marker: ({
      children,
      onClick,
    }: {
      children?: React.ReactNode;
      onClick?: (e: { originalEvent: { stopPropagation: () => void } }) => void;
    }) => (
      <div
        data-testid="marker"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onClick?.({ originalEvent: { stopPropagation: () => {} } });
        }}
      >
        {children}
      </div>
    ),
    Popup: ({
      children,
      onClose,
    }: {
      children?: React.ReactNode;
      onClose?: () => void;
    }) => (
      <div data-testid="popup">
        <button aria-label="Close popup" onClick={() => onClose?.()} />
        {children}
      </div>
    ),
  };
});

// Replace icon components with plain SVGs that carry a data-testid so tests
// can find them without relying on implementation details like class names.
jest.mock("lucide-react", () => ({
  Search: ({ size, className }: { size?: number; className?: string }) => (
    <svg data-testid="search-icon" className={className} width={size} />
  ),
  X: ({ size }: { size?: number }) => (
    <svg data-testid="clear-icon" width={size} />
  ),
  MapPin: ({ size, className }: { size?: number; className?: string }) => (
    <svg data-testid="mappin-icon" className={className} width={size} />
  ),
}));

// Provide a fixed map center so tests don't depend on the real constants file.
jest.mock("@/lib/constants", () => ({
  MAP_DEFAULTS: { center: [40.7608, -111.891] as [number, number], zoom: 13 },
}));

jest.mock("@/lib/auth", () => ({
  useAuth: () => ({ user: { uid: "admin-1" } }),
}));

const mockSubscribeToIncidents = jest.fn((cb: (incidents: Incident[]) => void) => {
  cb([]);
  return jest.fn();
});
const mockSubscribeToUserProfiles = jest.fn((cb: (users: UserProfile[]) => void) => {
  cb([]);
  return jest.fn();
});
const mockCreateIncident = jest.fn().mockResolvedValue("new-incident-id");
const mockUpdateIncidentStatus = jest.fn().mockResolvedValue(undefined);

jest.mock("@/lib/firestore", () => ({
  subscribeToIncidents: (cb: (incidents: Incident[]) => void) => mockSubscribeToIncidents(cb),
  subscribeToUserProfiles: (cb: (users: UserProfile[]) => void) => mockSubscribeToUserProfiles(cb),
  createIncident: (...args: unknown[]) => mockCreateIncident(...args),
  updateIncidentStatus: (...args: unknown[]) => mockUpdateIncidentStatus(...args),
}));

function makeIncident(overrides: Partial<Incident> = {}): Incident {
  return {
    id: "inc1",
    type: "blocked_path",
    status: "under_review",
    location: { lat: 40.76, lng: -111.89 },
    address: "123 Main St",
    description: "",
    reportedAt: "April 21, 2026",
    reportedBy: "user-123",
    ...overrides,
  };
}

// Two realistic Nominatim results used across multiple search tests.
const mockResults = [
  {
    place_id: 1,
    display_name: "Salt Lake City, Utah, United States",
    lat: "40.7608",
    lon: "-111.8910",
  },
  {
    place_id: 2,
    display_name: "Salt Lake County, Utah, United States",
    lat: "40.6676",
    lon: "-111.9240",
  },
];

// Point the global fetch at a mock that returns whatever data we pass in.
function mockFetchWith(data: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => data,
  } as Response);
}

// userEvent needs to know about fake timers so it can advance them internally
// when simulating keystrokes (each key fires its own debounce timer).
function setupUser() {
  return userEvent.setup({
    advanceTimers: (ms) => act(() => { jest.advanceTimersByTime(ms); }),
  });
}

// Use fake timers so we can control the 500ms debounce without real waiting.
beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  // clearAllMocks only resets call history, not implementations set via
  // mockImplementation — restore the defaults so one test's custom incident
  // list can't leak into the next.
  mockSubscribeToIncidents.mockImplementation((cb: (incidents: Incident[]) => void) => {
    cb([]);
    return jest.fn();
  });
  mockSubscribeToUserProfiles.mockImplementation((cb: (users: UserProfile[]) => void) => {
    cb([]);
    return jest.fn();
  });
  mockCreateIncident.mockResolvedValue("new-incident-id");
  mockUpdateIncidentStatus.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe("AdminDashboardMap search bar", () => {
  it("renders the search input with the correct placeholder", () => {
    render(<AdminDashboardMap />);
    expect(
      screen.getByPlaceholderText("Enter your Address")
    ).toBeInTheDocument();
  });

  it("shows the MapPin icon when the input is empty", () => {
    render(<AdminDashboardMap />);
    expect(screen.getByTestId("mappin-icon")).toBeInTheDocument();
  });

  it("does not show the clear button when the input is empty", () => {
    render(<AdminDashboardMap />);
    expect(screen.queryByTestId("clear-icon")).not.toBeInTheDocument();
  });

  it("does not fetch or show a dropdown for queries shorter than 3 chars", async () => {
    mockFetchWith(mockResults);
    const user = setupUser();
    render(<AdminDashboardMap />);
    const input = screen.getByPlaceholderText("Enter your Address");

    await user.type(input, "Sa"); // only 2 characters — below the minimum
    act(() => jest.runAllTimers());

    expect(fetch).not.toHaveBeenCalled();
    expect(
      screen.queryByText("Salt Lake City, Utah, United States")
    ).not.toBeInTheDocument();
  });

  it("fetches Nominatim and displays results after the 500ms debounce", async () => {
    mockFetchWith(mockResults);
    const user = setupUser();
    render(<AdminDashboardMap />);
    const input = screen.getByPlaceholderText("Enter your Address");

    await user.type(input, "Salt");
    act(() => jest.advanceTimersByTime(500)); // trigger the debounce

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("Salt"),
        expect.objectContaining({ headers: { "Accept-Language": "en" } })
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText("Salt Lake City, Utah, United States")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Salt Lake County, Utah, United States")
      ).toBeInTheDocument();
    });
  });

  it("does not fire a request before the 500ms debounce elapses", async () => {
    mockFetchWith(mockResults);
    const user = setupUser();
    render(<AdminDashboardMap />);
    const input = screen.getByPlaceholderText("Enter your Address");

    await user.type(input, "Salt");
    act(() => jest.advanceTimersByTime(499)); // one ms short — should not fire

    expect(fetch).not.toHaveBeenCalled();
  });

  it("fires only one request for rapid consecutive typing (debounce)", async () => {
    mockFetchWith(mockResults);
    const user = setupUser();
    render(<AdminDashboardMap />);
    const input = screen.getByPlaceholderText("Enter your Address");

    // Type "Sal", advance 200ms (timer resets), type "t", then let the
    // debounce expire — only the final timer should fire a fetch.
    await user.type(input, "Sal");
    act(() => jest.advanceTimersByTime(200));
    await user.type(input, "t");
    act(() => jest.advanceTimersByTime(500));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  });

  it("selecting a result sets the input value and closes the dropdown", async () => {
    mockFetchWith(mockResults);
    const user = setupUser();
    render(<AdminDashboardMap />);
    const input = screen.getByPlaceholderText("Enter your Address");

    await user.type(input, "Salt");
    act(() => jest.advanceTimersByTime(500));
    await waitFor(() =>
      screen.getByText("Salt Lake City, Utah, United States")
    );

    fireEvent.click(screen.getByText("Salt Lake City, Utah, United States"));

    expect(input).toHaveValue("Salt Lake City, Utah, United States");
    // The rest of the dropdown should also be gone
    expect(
      screen.queryByText("Salt Lake County, Utah, United States")
    ).not.toBeInTheDocument();
  });

  it("flies to the selected location and settles in the tilted 3D view", async () => {
    mockFetchWith(mockResults);
    const user = setupUser();
    render(<AdminDashboardMap />);
    const input = screen.getByPlaceholderText("Enter your Address");

    await user.type(input, "Salt");
    act(() => jest.advanceTimersByTime(500));
    await waitFor(() => screen.getByText("Salt Lake City, Utah, United States"));

    fireEvent.click(screen.getByText("Salt Lake City, Utah, United States"));

    await waitFor(() =>
      expect(mockFlyTo).toHaveBeenCalledWith(
        expect.objectContaining({
          center: [-111.891, 40.7608],
          pitch: 55,
          zoom: 17,
        })
      )
    );
  });

  it("clear button removes query text and hides the dropdown", async () => {
    mockFetchWith(mockResults);
    const user = setupUser();
    render(<AdminDashboardMap />);
    const input = screen.getByPlaceholderText("Enter your Address");

    await user.type(input, "Salt");
    act(() => jest.advanceTimersByTime(500));
    await waitFor(() =>
      screen.getByText("Salt Lake City, Utah, United States")
    );

    // The X button is inside a <button> wrapping the clear icon
    const clearBtn = screen.getByTestId("clear-icon").closest("button")!;
    fireEvent.click(clearBtn);

    expect(input).toHaveValue("");
    expect(
      screen.queryByText("Salt Lake City, Utah, United States")
    ).not.toBeInTheDocument();
  });

  it("hides dropdown when clicking outside the search widget", async () => {
    mockFetchWith(mockResults);
    const user = setupUser();
    render(<AdminDashboardMap />);
    const input = screen.getByPlaceholderText("Enter your Address");

    await user.type(input, "Salt");
    act(() => jest.advanceTimersByTime(500));
    await waitFor(() =>
      screen.getByText("Salt Lake City, Utah, United States")
    );

    // Simulate a click on an area outside the search container
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(
        screen.queryByText("Salt Lake City, Utah, United States")
      ).not.toBeInTheDocument();
    });
  });

  it("re-opens the dropdown on input focus when results are already loaded", async () => {
    mockFetchWith(mockResults);
    const user = setupUser();
    render(<AdminDashboardMap />);
    const input = screen.getByPlaceholderText("Enter your Address");

    await user.type(input, "Salt");
    act(() => jest.advanceTimersByTime(500));
    await waitFor(() =>
      screen.getByText("Salt Lake City, Utah, United States")
    );

    // Close the dropdown, then re-focus — results are still in state so the
    // dropdown should reappear without another network request.
    fireEvent.mouseDown(document.body);
    await waitFor(() =>
      expect(
        screen.queryByText("Salt Lake City, Utah, United States")
      ).not.toBeInTheDocument()
    );

    fireEvent.focus(input);
    expect(
      screen.getByText("Salt Lake City, Utah, United States")
    ).toBeInTheDocument();
  });

  it("shows no dropdown when the API returns an empty array", async () => {
    mockFetchWith([]); // location not found
    const user = setupUser();
    render(<AdminDashboardMap />);
    const input = screen.getByPlaceholderText("Enter your Address");

    await user.type(input, "xyzzy");
    act(() => jest.advanceTimersByTime(500));

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(
      screen.queryByText("Salt Lake City, Utah, United States")
    ).not.toBeInTheDocument();
  });

  it("handles a fetch error gracefully without crashing", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
    const user = setupUser();
    render(<AdminDashboardMap />);
    const input = screen.getByPlaceholderText("Enter your Address");

    await user.type(input, "Salt");
    act(() => jest.advanceTimersByTime(500));

    // The component should swallow the error and leave the input usable
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(
      screen.queryByText("Salt Lake City, Utah, United States")
    ).not.toBeInTheDocument();
    expect(input).toBeInTheDocument();
  });
});

describe("AdminDashboardMap stats cards", () => {
  it("renders all three stat card labels", () => {
    render(<AdminDashboardMap />);
    expect(screen.getByText("Total Users")).toBeInTheDocument();
    expect(screen.getByText("Pending Reports")).toBeInTheDocument();
    expect(screen.getByText("Approved Incidents")).toBeInTheDocument();
  });

  it("shows zero counts when there are no users or incidents", () => {
    render(<AdminDashboardMap />);
    expect(screen.getAllByText("0")).toHaveLength(3);
  });

  it("counts users and incidents from the live subscriptions", () => {
    mockSubscribeToUserProfiles.mockImplementation((cb: (users: UserProfile[]) => void) => {
      cb([
        { uid: "u1", displayName: "A", email: "a@test.com", role: "user", createdAt: "", status: "online" },
        { uid: "u2", displayName: "B", email: "b@test.com", role: "user", createdAt: "", status: "offline" },
      ]);
      return jest.fn();
    });
    mockSubscribeToIncidents.mockImplementation((cb: (incidents: Incident[]) => void) => {
      cb([
        makeIncident({ id: "a", status: "under_review" }),
        makeIncident({ id: "b", status: "approved" }),
        makeIncident({ id: "c", status: "approved" }),
      ]);
      return jest.fn();
    });

    render(<AdminDashboardMap />);

    const totalUsersRow = screen.getByText("Total Users").closest("div")!;
    expect(within(totalUsersRow).getByText("2")).toBeInTheDocument();

    const pendingRow = screen.getByText("Pending Reports").closest("div")!;
    expect(within(pendingRow).getByText("1")).toBeInTheDocument();

    const approvedRow = screen.getByText("Approved Incidents").closest("div")!;
    expect(within(approvedRow).getByText("2")).toBeInTheDocument();
  });

  it("shows the map instructions hint when no pending pin exists", () => {
    render(<AdminDashboardMap />);
    expect(
      screen.getByText(
        "Click anywhere on the map to add an incident, then click the pin to set type + description"
      )
    ).toBeInTheDocument();
  });
});

describe("AdminDashboardMap incident markers and review popup", () => {
  it("renders a marker for each incident from Firestore", () => {
    mockSubscribeToIncidents.mockImplementation((cb: (incidents: Incident[]) => void) => {
      cb([makeIncident({ id: "a" }), makeIncident({ id: "b" })]);
      return jest.fn();
    });
    render(<AdminDashboardMap />);
    expect(screen.getAllByTestId("marker")).toHaveLength(2);
  });

  it("does not show a review popup until a marker is clicked", () => {
    mockSubscribeToIncidents.mockImplementation((cb: (incidents: Incident[]) => void) => {
      cb([makeIncident()]);
      return jest.fn();
    });
    render(<AdminDashboardMap />);
    expect(screen.queryByTestId("popup")).not.toBeInTheDocument();
  });

  it("shows Approve/Deny actions for an under_review incident after clicking its marker", () => {
    mockSubscribeToIncidents.mockImplementation((cb: (incidents: Incident[]) => void) => {
      cb([makeIncident({ status: "under_review", address: "1234 W Maple Dr" })]);
      return jest.fn();
    });
    render(<AdminDashboardMap />);

    fireEvent.click(screen.getByTestId("marker"));

    expect(screen.getByText("1234 W Maple Dr")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Deny" })).toBeInTheDocument();
  });

  it("calls updateIncidentStatus with 'approved' when Approve is clicked", () => {
    mockSubscribeToIncidents.mockImplementation((cb: (incidents: Incident[]) => void) => {
      cb([makeIncident({ id: "inc-approve", status: "under_review" })]);
      return jest.fn();
    });
    render(<AdminDashboardMap />);

    fireEvent.click(screen.getByTestId("marker"));
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    expect(mockUpdateIncidentStatus).toHaveBeenCalledWith("inc-approve", "approved");
  });

  it("calls updateIncidentStatus with 'not_confirmed' when Deny is clicked", () => {
    mockSubscribeToIncidents.mockImplementation((cb: (incidents: Incident[]) => void) => {
      cb([makeIncident({ id: "inc-deny", status: "under_review" })]);
      return jest.fn();
    });
    render(<AdminDashboardMap />);

    fireEvent.click(screen.getByTestId("marker"));
    fireEvent.click(screen.getByRole("button", { name: "Deny" }));

    expect(mockUpdateIncidentStatus).toHaveBeenCalledWith("inc-deny", "not_confirmed");
  });

  it("shows a decided status instead of actions for an already-approved incident", () => {
    mockSubscribeToIncidents.mockImplementation((cb: (incidents: Incident[]) => void) => {
      cb([makeIncident({ status: "approved" })]);
      return jest.fn();
    });
    render(<AdminDashboardMap />);

    fireEvent.click(screen.getByTestId("marker"));

    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
  });
});

describe("AdminDashboardMap pending pin creation", () => {
  it("drops a pending pin when the map is clicked, without opening a form yet", () => {
    render(<AdminDashboardMap />);
    fireEvent.click(screen.getByTestId("map-container"));

    expect(screen.getByTestId("marker")).toBeInTheDocument();
    expect(screen.queryByTestId("popup")).not.toBeInTheDocument();
  });

  it("opens the new-incident form when the pending pin is clicked", () => {
    render(<AdminDashboardMap />);
    fireEvent.click(screen.getByTestId("map-container"));
    fireEvent.click(screen.getByTestId("marker"));

    expect(screen.getByText("New Incident")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
  });

  it("removes the pending pin when Cancel is clicked", () => {
    render(<AdminDashboardMap />);
    fireEvent.click(screen.getByTestId("map-container"));
    fireEvent.click(screen.getByTestId("marker"));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByTestId("marker")).not.toBeInTheDocument();
    expect(screen.queryByText("New Incident")).not.toBeInTheDocument();
  });

  it("creates an approved incident on Submit", async () => {
    mockFetchWith({ display_name: "1234 W Maple Dr, Salt Lake City, UT" });
    render(<AdminDashboardMap />);
    fireEvent.click(screen.getByTestId("map-container"));
    fireEvent.click(screen.getByTestId("marker"));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    });

    await waitFor(() =>
      expect(mockCreateIncident).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "blocked_path",
          status: "approved",
          location: { lat: 40.7608, lng: -111.891 },
          reportedBy: "admin-1",
        })
      )
    );
  });
});
