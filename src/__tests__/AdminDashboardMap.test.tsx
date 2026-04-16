import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminDashboardMap from "@/components/admin/AdminDashboardMap";

// Leaflet calls browser APIs (canvas, SVG) that don't exist in the Jest DOM
// environment, so we replace it with a no-op stub.
jest.mock("leaflet", () => ({
  divIcon: () => ({}),
}));

// react-leaflet wraps Leaflet and also needs a real browser.
// Each component is replaced with a plain HTML element so React can still
// render the component tree and we can assert on the UI around the map.
jest.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => null, // just a tile URL, nothing to assert on
  Marker: ({ children }: { children?: React.ReactNode }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: { children?: React.ReactNode }) => <div data-testid="popup">{children}</div>,
  useMapEvents: () => null, // map click events are tested separately
  useMap: () => ({ flyTo: jest.fn() }),
}));

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
    expect(screen.getByText("Active Users")).toBeInTheDocument();
    expect(screen.getByText("Pending Reports")).toBeInTheDocument();
    expect(screen.getByText("Saved high-risk areas")).toBeInTheDocument();
  });

  it("shows the baseline saved high-risk areas count of 101", () => {
    // The count is hardcoded as 101 + dynamically added areas (0 on first render)
    render(<AdminDashboardMap />);
    expect(screen.getByText("101")).toBeInTheDocument();
  });

  it("shows the map instructions hint when no pending pin exists", () => {
    render(<AdminDashboardMap />);
    expect(
      screen.getByText("Click anywhere on the map to add a high-risk area pin")
    ).toBeInTheDocument();
  });
});
