import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import IncidentsPage from "@/app/dashboard/incidents/page";
import { Incident } from "@/lib/types";

jest.mock("@/lib/auth", () => ({
  useAuth: () => ({ user: { uid: "user-123" } }),
}));

const mockSubscribeToIncidents = jest.fn();
const mockCreateIncident = jest.fn();
jest.mock("@/lib/firestore", () => ({
  subscribeToIncidents: (...args: unknown[]) => mockSubscribeToIncidents(...args),
  createIncident: (...args: unknown[]) => mockCreateIncident(...args),
}));

const mockGetCurrentPosition = jest.fn();
Object.defineProperty(global.navigator, "geolocation", {
  value: { getCurrentPosition: mockGetCurrentPosition },
  configurable: true,
  writable: true,
});

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

function mockGpsSuccess(lat = 40.7608, lng = -111.891) {
  mockGetCurrentPosition.mockImplementation((success: PositionCallback) => {
    success({ coords: { latitude: lat, longitude: lng } } as GeolocationPosition);
  });
}

function mockGpsFailure() {
  mockGetCurrentPosition.mockImplementation(
    (_success: PositionCallback, error: PositionErrorCallback) => {
      error({ code: 1, message: "denied" } as GeolocationPositionError);
    }
  );
}

function mockReverseGeocode(displayName = "123 Main St, Salt Lake City, UT") {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ display_name: displayName }),
  } as Response);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSubscribeToIncidents.mockImplementation((cb: (i: Incident[]) => void) => {
    cb([]);
    return jest.fn();
  });
  mockCreateIncident.mockResolvedValue("new-inc-id");
  mockReverseGeocode();
});

describe("IncidentsPage — initial render", () => {
  it("renders the Incident History heading", () => {
    render(<IncidentsPage />);
    expect(screen.getByText("Incident History")).toBeInTheDocument();
  });

  it("renders the Report Incident button", () => {
    render(<IncidentsPage />);
    expect(screen.getByRole("button", { name: /report incident/i })).toBeInTheDocument();
  });

  it("shows empty state when the user has no incidents", () => {
    render(<IncidentsPage />);
    expect(screen.getByText("No incidents reported")).toBeInTheDocument();
  });

  it("subscribes to incidents on mount and unsubscribes on unmount", () => {
    const unsub = jest.fn();
    mockSubscribeToIncidents.mockReturnValue(unsub);
    const { unmount } = render(<IncidentsPage />);
    expect(mockSubscribeToIncidents).toHaveBeenCalledTimes(1);
    unmount();
    expect(unsub).toHaveBeenCalled();
  });
});

describe("IncidentsPage — incident history table", () => {
  it("shows a user's own incidents in the table", () => {
    mockSubscribeToIncidents.mockImplementation((cb: (i: Incident[]) => void) => {
      cb([makeIncident({ address: "456 Oak Ave" })]);
      return jest.fn();
    });
    render(<IncidentsPage />);
    expect(screen.getByText("456 Oak Ave")).toBeInTheDocument();
  });

  it("does not show incidents belonging to other users", () => {
    mockSubscribeToIncidents.mockImplementation((cb: (i: Incident[]) => void) => {
      cb([makeIncident({ reportedBy: "other-user", address: "Secret St" })]);
      return jest.fn();
    });
    render(<IncidentsPage />);
    expect(screen.queryByText("Secret St")).not.toBeInTheDocument();
    expect(screen.getByText("No incidents reported")).toBeInTheDocument();
  });

  it("shows the correct type label", () => {
    mockSubscribeToIncidents.mockImplementation((cb: (i: Incident[]) => void) => {
      cb([makeIncident({ type: "construction" })]);
      return jest.fn();
    });
    render(<IncidentsPage />);
    expect(screen.getByText("Under Construction")).toBeInTheDocument();
  });

  it("shows Approved status badge", () => {
    mockSubscribeToIncidents.mockImplementation((cb: (i: Incident[]) => void) => {
      cb([makeIncident({ status: "approved" })]);
      return jest.fn();
    });
    render(<IncidentsPage />);
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });

  it("shows Under Review status badge", () => {
    mockSubscribeToIncidents.mockImplementation((cb: (i: Incident[]) => void) => {
      cb([makeIncident({ status: "under_review" })]);
      return jest.fn();
    });
    render(<IncidentsPage />);
    expect(screen.getByText("Under Review")).toBeInTheDocument();
  });

  it("shows Not Confirmed status badge", () => {
    mockSubscribeToIncidents.mockImplementation((cb: (i: Incident[]) => void) => {
      cb([makeIncident({ status: "not_confirmed" })]);
      return jest.fn();
    });
    render(<IncidentsPage />);
    expect(screen.getByText("Not Confirmed")).toBeInTheDocument();
  });

  it("shows the reported date in the table", () => {
    mockSubscribeToIncidents.mockImplementation((cb: (i: Incident[]) => void) => {
      cb([makeIncident({ reportedAt: "March 5, 2026" })]);
      return jest.fn();
    });
    render(<IncidentsPage />);
    expect(screen.getByText("March 5, 2026")).toBeInTheDocument();
  });
});

describe("IncidentsPage — modal open and close", () => {
  it("modal is not visible on initial render", () => {
    render(<IncidentsPage />);
    expect(screen.queryByRole("heading", { name: "Report Incident" })).not.toBeInTheDocument();
  });

  it("opens the modal when Report Incident button is clicked", () => {
    mockGpsSuccess();
    render(<IncidentsPage />);
    fireEvent.click(screen.getByRole("button", { name: /report incident/i }));
    expect(screen.getByRole("heading", { name: "Report Incident" })).toBeInTheDocument();
  });

  it("closes the modal when Cancel is clicked", () => {
    mockGpsSuccess();
    render(<IncidentsPage />);
    fireEvent.click(screen.getByRole("button", { name: /report incident/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("heading", { name: "Report Incident" })).not.toBeInTheDocument();
  });
});

describe("IncidentsPage — GPS location", () => {
  it("shows 'Getting your location...' while GPS is pending", () => {
    mockGetCurrentPosition.mockImplementation(() => {});
    render(<IncidentsPage />);
    fireEvent.click(screen.getByRole("button", { name: /report incident/i }));
    expect(screen.getByText(/getting your location/i)).toBeInTheDocument();
  });

  it("shows the address after GPS resolves", async () => {
    mockGpsSuccess();
    render(<IncidentsPage />);
    fireEvent.click(screen.getByRole("button", { name: /report incident/i }));
    await waitFor(() =>
      expect(screen.getByText("123 Main St, Salt Lake City, UT")).toBeInTheDocument()
    );
  });

  it("shows error message when GPS is denied", () => {
    mockGpsFailure();
    render(<IncidentsPage />);
    fireEvent.click(screen.getByRole("button", { name: /report incident/i }));
    expect(screen.getByText(/could not get your location/i)).toBeInTheDocument();
  });

  it("shows Try again button on GPS failure", () => {
    mockGpsFailure();
    render(<IncidentsPage />);
    fireEvent.click(screen.getByRole("button", { name: /report incident/i }));
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("re-requests GPS when Try again is clicked", () => {
    mockGpsFailure();
    render(<IncidentsPage />);
    fireEvent.click(screen.getByRole("button", { name: /report incident/i }));
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(2);
  });

  it("falls back to raw coordinates if reverse geocoding fails", async () => {
    mockGpsSuccess(40.7608, -111.891);
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
    render(<IncidentsPage />);
    fireEvent.click(screen.getByRole("button", { name: /report incident/i }));
    await waitFor(() =>
      expect(screen.getByText(/40\.76080.*-111\.89100/)).toBeInTheDocument()
    );
  });
});

describe("IncidentsPage — form interaction", () => {
  it("Submit button is disabled while GPS is pending", () => {
    mockGetCurrentPosition.mockImplementation(() => {});
    render(<IncidentsPage />);
    fireEvent.click(screen.getByRole("button", { name: /report incident/i }));
    expect(screen.getByRole("button", { name: /submit report/i })).toBeDisabled();
  });

  it("Submit button is enabled once location is acquired", async () => {
    mockGpsSuccess();
    render(<IncidentsPage />);
    fireEvent.click(screen.getByRole("button", { name: /report incident/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /submit report/i })).not.toBeDisabled()
    );
  });

  it("can change the incident type", async () => {
    mockGpsSuccess();
    const user = userEvent.setup();
    render(<IncidentsPage />);
    fireEvent.click(screen.getByRole("button", { name: /report incident/i }));
    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "construction");
    expect(select).toHaveValue("construction");
  });

  it("can type a description", async () => {
    mockGpsSuccess();
    const user = userEvent.setup();
    render(<IncidentsPage />);
    fireEvent.click(screen.getByRole("button", { name: /report incident/i }));
    const textarea = screen.getByPlaceholderText(/describe the obstacle/i);
    await user.type(textarea, "Big crack in pavement");
    expect(textarea).toHaveValue("Big crack in pavement");
  });
});

describe("IncidentsPage — form submission", () => {
  it("calls createIncident with correct data on submit", async () => {
    mockGpsSuccess(40.7608, -111.891);
    render(<IncidentsPage />);
    fireEvent.click(screen.getByRole("button", { name: /report incident/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /submit report/i })).not.toBeDisabled()
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /submit report/i }));
    });
    expect(mockCreateIncident).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "blocked_path",
        status: "under_review",
        location: { lat: 40.7608, lng: -111.891 },
        reportedBy: "user-123",
      })
    );
  });

  it("closes the modal after successful submission", async () => {
    mockGpsSuccess();
    render(<IncidentsPage />);
    fireEvent.click(screen.getByRole("button", { name: /report incident/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /submit report/i })).not.toBeDisabled()
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /submit report/i }));
    });
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Report Incident" })).not.toBeInTheDocument()
    );
  });

  it("shows an error message when submission fails", async () => {
    mockGpsSuccess();
    mockCreateIncident.mockRejectedValue(new Error("Firestore error"));
    render(<IncidentsPage />);
    fireEvent.click(screen.getByRole("button", { name: /report incident/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /submit report/i })).not.toBeDisabled()
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /submit report/i }));
    });
    await waitFor(() =>
      expect(screen.getByText(/failed to submit/i)).toBeInTheDocument()
    );
  });

  it("resets form state when modal is reopened", async () => {
    mockGpsSuccess();
    const user = userEvent.setup();
    render(<IncidentsPage />);
    fireEvent.click(screen.getByRole("button", { name: /report incident/i }));
    await user.type(screen.getByPlaceholderText(/describe the obstacle/i), "Some text");
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    fireEvent.click(screen.getByRole("button", { name: /report incident/i }));
    expect(screen.getByPlaceholderText(/describe the obstacle/i)).toHaveValue("");
  });
});
