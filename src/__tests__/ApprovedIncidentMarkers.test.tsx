import React from "react";
import { render, screen } from "@testing-library/react";
import ApprovedIncidentMarkers from "@/components/landing/ApprovedIncidentMarkers";
import { Incident } from "@/lib/types";

jest.mock("leaflet", () => ({
  divIcon: jest.fn(() => ({ options: {} })),
}));

jest.mock("react-leaflet", () => ({
  Marker: ({
    children,
    position,
  }: {
    children: React.ReactNode;
    position: [number, number];
  }) => (
    <div
      data-testid="marker"
      data-lat={position[0]}
      data-lng={position[1]}
    >
      {children}
    </div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
}));

function makeIncident(overrides: Partial<Incident> = {}): Incident {
  return {
    id: "inc1",
    type: "blocked_path",
    status: "approved",
    location: { lat: 40.76, lng: -111.89 },
    address: "123 Main St",
    description: "",
    reportedAt: "April 21, 2026",
    reportedBy: "user1",
    ...overrides,
  };
}

describe("ApprovedIncidentMarkers", () => {
  it("renders nothing when incidents array is empty", () => {
    const { container } = render(<ApprovedIncidentMarkers incidents={[]} />);
    expect(container.querySelector("[data-testid='marker']")).toBeNull();
  });

  it("renders a marker for each approved incident", () => {
    const incidents = [
      makeIncident({ id: "a", status: "approved" }),
      makeIncident({ id: "b", status: "approved" }),
    ];
    render(<ApprovedIncidentMarkers incidents={incidents} />);
    expect(screen.getAllByTestId("marker")).toHaveLength(2);
  });

  it("filters out non-approved incidents", () => {
    const incidents = [
      makeIncident({ id: "a", status: "approved" }),
      makeIncident({ id: "b", status: "under_review" }),
      makeIncident({ id: "c", status: "not_confirmed" }),
    ];
    render(<ApprovedIncidentMarkers incidents={incidents} />);
    expect(screen.getAllByTestId("marker")).toHaveLength(1);
  });

  it("renders no markers when all incidents are under_review", () => {
    const incidents = [
      makeIncident({ id: "a", status: "under_review" }),
      makeIncident({ id: "b", status: "under_review" }),
    ];
    const { container } = render(<ApprovedIncidentMarkers incidents={incidents} />);
    expect(container.querySelector("[data-testid='marker']")).toBeNull();
  });

  it("places the marker at the correct lat/lng", () => {
    const incidents = [
      makeIncident({ location: { lat: 40.7608, lng: -111.891 } }),
    ];
    render(<ApprovedIncidentMarkers incidents={incidents} />);
    const marker = screen.getByTestId("marker");
    expect(marker).toHaveAttribute("data-lat", "40.7608");
    expect(marker).toHaveAttribute("data-lng", "-111.891");
  });

  it("shows the correct type label in the popup", () => {
    render(
      <ApprovedIncidentMarkers
        incidents={[makeIncident({ type: "construction" })]}
      />
    );
    expect(screen.getByText("Under Construction")).toBeInTheDocument();
  });

  it("shows the address in the popup", () => {
    render(
      <ApprovedIncidentMarkers
        incidents={[makeIncident({ address: "456 Oak Ave, Salt Lake City" })]}
      />
    );
    expect(screen.getByText("456 Oak Ave, Salt Lake City")).toBeInTheDocument();
  });

  it("shows the reportedAt date in the popup", () => {
    render(
      <ApprovedIncidentMarkers
        incidents={[makeIncident({ reportedAt: "January 1, 2026" })]}
      />
    );
    expect(screen.getByText("January 1, 2026")).toBeInTheDocument();
  });

  it("renders correct type labels for all incident types", () => {
    const types: Incident["type"][] = [
      "blocked_path",
      "construction",
      "uneven_sidewalk",
      "low_obstacle",
      "other",
    ];
    const expectedLabels = [
      "Blocked Path",
      "Under Construction",
      "Uneven Sidewalk",
      "Low Obstacle",
      "Other",
    ];

    types.forEach((type, i) => {
      const { unmount } = render(
        <ApprovedIncidentMarkers
          incidents={[makeIncident({ id: type, type })]}
        />
      );
      expect(screen.getByText(expectedLabels[i])).toBeInTheDocument();
      unmount();
    });
  });
});
