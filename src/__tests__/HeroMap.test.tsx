import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HeroMap from "@/components/landing/HeroMap";

const mockSubscribeToIncidents = jest.fn((cb: (i: unknown[]) => void) => {
  cb([]);
  return jest.fn();
});
jest.mock("@/lib/firestore", () => ({
  subscribeToIncidents: (...args: unknown[]) =>
    mockSubscribeToIncidents(args[0] as (i: unknown[]) => void),
}));

// Stub next/dynamic so MapWrapper renders as a lightweight element
jest.mock("next/dynamic", () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const dynamic = (_loader: unknown, _opts?: unknown) => {
    const Mock = () => <div data-testid="map-wrapper" />;
    Mock.displayName = "MockDynamic";
    return Mock;
  };
  return dynamic;
});

// Stub lucide-react icons to plain SVG elements
jest.mock("lucide-react", () => ({
  Search: ({ size, className }: { size?: number; className?: string }) => (
    <svg data-testid="search-icon" className={className} width={size} />
  ),
  X: ({ size }: { size?: number }) => (
    <svg data-testid="clear-icon" width={size} />
  ),
}));

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

function mockFetchWith(data: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => data,
  } as Response);
}

// Creates a user-event instance that knows how to advance fake timers
function setupUser() {
  return userEvent.setup({
    advanceTimers: (ms) => act(() => { jest.advanceTimersByTime(ms); }),
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe("HeroMap search bar", () => {
  it("renders the search input with placeholder text", () => {
    render(<HeroMap />);
    expect(
      screen.getByPlaceholderText("Search for locations...")
    ).toBeInTheDocument();
  });

  it("clear button is not visible when the input is empty", () => {
    render(<HeroMap />);
    expect(screen.queryByTestId("clear-icon")).not.toBeInTheDocument();
  });

  it("does not fetch or show a dropdown when query is fewer than 3 chars", async () => {
    mockFetchWith(mockResults);
    const user = setupUser();
    render(<HeroMap />);
    const input = screen.getByPlaceholderText("Search for locations...");

    await user.type(input, "Sa");
    act(() => jest.runAllTimers());

    expect(fetch).not.toHaveBeenCalled();
    expect(
      screen.queryByText("Salt Lake City, Utah, United States")
    ).not.toBeInTheDocument();
  });

  it("fetches Nominatim and shows results after the 500ms debounce", async () => {
    mockFetchWith(mockResults);
    const user = setupUser();
    render(<HeroMap />);
    const input = screen.getByPlaceholderText("Search for locations...");

    await user.type(input, "Salt");
    act(() => jest.advanceTimersByTime(500));

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
    render(<HeroMap />);
    const input = screen.getByPlaceholderText("Search for locations...");

    await user.type(input, "Salt");
    act(() => jest.advanceTimersByTime(499));

    expect(fetch).not.toHaveBeenCalled();
  });

  it("only fires one request for rapid consecutive typing (debounce)", async () => {
    mockFetchWith(mockResults);
    const user = setupUser();
    render(<HeroMap />);
    const input = screen.getByPlaceholderText("Search for locations...");

    await user.type(input, "Sal");
    act(() => jest.advanceTimersByTime(200)); // not yet fired
    await user.type(input, "t");
    act(() => jest.advanceTimersByTime(500)); // now fires

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  });

  it("selecting a result sets the input value and closes the dropdown", async () => {
    mockFetchWith(mockResults);
    const user = setupUser();
    render(<HeroMap />);
    const input = screen.getByPlaceholderText("Search for locations...");

    await user.type(input, "Salt");
    act(() => jest.advanceTimersByTime(500));
    await waitFor(() =>
      screen.getByText("Salt Lake City, Utah, United States")
    );

    fireEvent.click(screen.getByText("Salt Lake City, Utah, United States"));

    expect(input).toHaveValue("Salt Lake City, Utah, United States");
    expect(
      screen.queryByText("Salt Lake County, Utah, United States")
    ).not.toBeInTheDocument();
  });

  it("clear button removes the query text and hides the dropdown", async () => {
    mockFetchWith(mockResults);
    const user = setupUser();
    render(<HeroMap />);
    const input = screen.getByPlaceholderText("Search for locations...");

    await user.type(input, "Salt");
    act(() => jest.advanceTimersByTime(500));
    await waitFor(() =>
      screen.getByText("Salt Lake City, Utah, United States")
    );

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
    render(<HeroMap />);
    const input = screen.getByPlaceholderText("Search for locations...");

    await user.type(input, "Salt");
    act(() => jest.advanceTimersByTime(500));
    await waitFor(() =>
      screen.getByText("Salt Lake City, Utah, United States")
    );

    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(
        screen.queryByText("Salt Lake City, Utah, United States")
      ).not.toBeInTheDocument();
    });
  });

  it("re-opens the dropdown on focus when results are already loaded", async () => {
    mockFetchWith(mockResults);
    const user = setupUser();
    render(<HeroMap />);
    const input = screen.getByPlaceholderText("Search for locations...");

    await user.type(input, "Salt");
    act(() => jest.advanceTimersByTime(500));
    await waitFor(() =>
      screen.getByText("Salt Lake City, Utah, United States")
    );

    // Close via outside click
    fireEvent.mouseDown(document.body);
    await waitFor(() =>
      expect(
        screen.queryByText("Salt Lake City, Utah, United States")
      ).not.toBeInTheDocument()
    );

    // Re-focus should reopen
    fireEvent.focus(input);
    expect(
      screen.getByText("Salt Lake City, Utah, United States")
    ).toBeInTheDocument();
  });

  it("shows no dropdown when the API returns an empty array", async () => {
    mockFetchWith([]);
    const user = setupUser();
    render(<HeroMap />);
    const input = screen.getByPlaceholderText("Search for locations...");

    await user.type(input, "xyzzy");
    act(() => jest.advanceTimersByTime(500));

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    // No result buttons rendered
    expect(screen.queryByRole("button", { name: /xyzzy/i })).toBeNull();
  });

  it("handles a fetch error gracefully without crashing", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
    const user = setupUser();
    render(<HeroMap />);
    const input = screen.getByPlaceholderText("Search for locations...");

    await user.type(input, "Salt");
    act(() => jest.advanceTimersByTime(500));

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    // No dropdown shown, component still mounted
    expect(
      screen.queryByText("Salt Lake City, Utah, United States")
    ).not.toBeInTheDocument();
    expect(input).toBeInTheDocument();
  });
});
