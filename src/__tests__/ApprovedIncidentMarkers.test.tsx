import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ApprovedIncidentMarkers from "@/components/landing/ApprovedIncidentMarkers";
import { Incident, PublicIncident } from "@/lib/types";
import { TILTED_PITCH } from "@/lib/mapStyle";

// react-map-gl's Marker/Popup are siblings, not nested — a marker's onClick
// selects it, and the popup only renders for whichever one is selected. The
// mock mirrors that: clicking the marker mock invokes onClick like a real
// map click would.
// Where the fake camera currently is; tests move it around.
const mockCamera = { lng: -111.89, lat: 40.76, zoom: 13, pitch: 0, bearing: 0 };

const mockMap = {
  flyTo: jest.fn(),
  jumpTo: jest.fn(),
  once: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  getZoom: () => mockCamera.zoom,
  getPitch: () => mockCamera.pitch,
  getBearing: () => mockCamera.bearing,
  getCenter: () => ({ lng: mockCamera.lng, lat: mockCamera.lat }),
};

jest.mock("lucide-react", () => ({
  ZoomOut: () => <svg data-testid="zoom-out-icon" />,
}));

jest.mock("react-map-gl/maplibre", () => ({
  useMap: () => ({ current: mockMap }),
  Marker: ({
    children,
    latitude,
    longitude,
    onClick,
  }: {
    children: React.ReactNode;
    latitude: number;
    longitude: number;
    onClick?: (e: { originalEvent: { stopPropagation: () => void } }) => void;
  }) => (
    <div
      data-testid="marker"
      data-lat={latitude}
      data-lng={longitude}
      onClick={() => onClick?.({ originalEvent: { stopPropagation: () => {} } })}
    >
      {children}
    </div>
  ),
  Popup: ({
    children,
    onClose,
  }: {
    children: React.ReactNode;
    onClose?: () => void;
  }) => (
    <div data-testid="popup">
      <button aria-label="Close popup" onClick={() => onClose?.()} />
      {children}
    </div>
  ),
}));

function makeIncident(overrides: Partial<PublicIncident> = {}): PublicIncident {
  return {
    id: "inc1",
    type: "blocked_path",
    location: { lat: 40.76, lng: -111.89 },
    address: "123 Main St",
    reportedAt: "April 21, 2026",
    ...overrides,
  };
}

describe("ApprovedIncidentMarkers", () => {
  it("renders nothing when incidents array is empty", () => {
    const { container } = render(<ApprovedIncidentMarkers incidents={[]} />);
    expect(container.querySelector("[data-testid='marker']")).toBeNull();
  });

  it("renders a marker for each public incident", () => {
    const incidents = [
      makeIncident({ id: "a" }),
      makeIncident({ id: "b" }),
    ];
    render(<ApprovedIncidentMarkers incidents={incidents} />);
    expect(screen.getAllByTestId("marker")).toHaveLength(2);
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

  it("does not show a popup until its marker is clicked", () => {
    render(<ApprovedIncidentMarkers incidents={[makeIncident()]} />);
    expect(screen.queryByTestId("popup")).not.toBeInTheDocument();
  });

  it("shows the correct type label in the popup after clicking the marker", () => {
    render(
      <ApprovedIncidentMarkers
        incidents={[makeIncident({ type: "construction" })]}
      />
    );
    fireEvent.click(screen.getByTestId("marker"));
    expect(screen.getByText("Under Construction")).toBeInTheDocument();
  });

  it("shows the address in the popup after clicking the marker", () => {
    render(
      <ApprovedIncidentMarkers
        incidents={[makeIncident({ address: "456 Oak Ave, Salt Lake City" })]}
      />
    );
    fireEvent.click(screen.getByTestId("marker"));
    expect(screen.getByText("456 Oak Ave, Salt Lake City")).toBeInTheDocument();
  });

  it("shows the reportedAt date in the popup after clicking the marker", () => {
    render(
      <ApprovedIncidentMarkers
        incidents={[makeIncident({ reportedAt: "January 1, 2026" })]}
      />
    );
    fireEvent.click(screen.getByTestId("marker"));
    expect(screen.getByText("January 1, 2026")).toBeInTheDocument();
  });

  it("only shows one popup at a time when multiple markers are clicked", () => {
    render(
      <ApprovedIncidentMarkers
        incidents={[
          makeIncident({ id: "a", address: "First St" }),
          makeIncident({ id: "b", address: "Second St" }),
        ]}
      />
    );
    const markers = screen.getAllByTestId("marker");
    fireEvent.click(markers[0]);
    expect(screen.getByText("First St")).toBeInTheDocument();

    fireEvent.click(markers[1]);
    expect(screen.getByText("Second St")).toBeInTheDocument();
    expect(screen.queryByText("First St")).not.toBeInTheDocument();
  });

  it("closes the popup when its close control fires onClose", () => {
    render(<ApprovedIncidentMarkers incidents={[makeIncident({ address: "Close Me St" })]} />);
    fireEvent.click(screen.getByTestId("marker"));
    expect(screen.getByText("Close Me St")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Close popup"));
    expect(screen.queryByTestId("popup")).not.toBeInTheDocument();
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
      fireEvent.click(screen.getByTestId("marker"));
      expect(screen.getByText(expectedLabels[i])).toBeInTheDocument();
      unmount();
    });
  });

  it("flies down to the pin at street level when it's clicked", () => {
    mockMap.flyTo.mockClear();
    render(
      <ApprovedIncidentMarkers
        incidents={[makeIncident({ location: { lat: 40.7608, lng: -111.891 } })]}
      />
    );
    fireEvent.click(screen.getByTestId("marker"));
    expect(mockMap.flyTo).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [-111.891, 40.7608],
        zoom: 17,
        pitch: TILTED_PITCH,
      })
    );
  });

  describe("zoom out button", () => {
    beforeEach(() => {
      mockMap.flyTo.mockClear();
      Object.assign(mockCamera, { lng: -111.9, lat: 40.7, zoom: 12.5, pitch: 0, bearing: 0 });
    });

    it("is hidden until a pin is clicked", () => {
      render(<ApprovedIncidentMarkers incidents={[makeIncident()]} />);
      expect(screen.queryByRole("button", { name: "Zoom out" })).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId("marker"));
      expect(screen.getByRole("button", { name: "Zoom out" })).toBeInTheDocument();
    });

    it("flies back to where the visitor was before clicking, and closes the popup", () => {
      render(<ApprovedIncidentMarkers incidents={[makeIncident()]} />);
      fireEvent.click(screen.getByTestId("marker"));
      fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));

      expect(mockMap.flyTo).toHaveBeenLastCalledWith(
        expect.objectContaining({ center: [-111.9, 40.7], zoom: 12.5, pitch: 0, bearing: 0 })
      );
      expect(screen.queryByTestId("popup")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Zoom out" })).not.toBeInTheDocument();
    });

    it("keeps the original view when hopping between pins", () => {
      render(
        <ApprovedIncidentMarkers
          incidents={[makeIncident({ id: "a" }), makeIncident({ id: "b" })]}
        />
      );
      const [first, second] = screen.getAllByTestId("marker");
      fireEvent.click(first);
      // Now down at street level next to the first pin.
      Object.assign(mockCamera, { zoom: 17, pitch: 55 });
      fireEvent.click(second);
      fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));

      expect(mockMap.flyTo).toHaveBeenLastCalledWith(
        expect.objectContaining({ center: [-111.9, 40.7], zoom: 12.5 })
      );
    });

    it("pulls out to the flat city view if the visitor was already at street level", () => {
      Object.assign(mockCamera, { zoom: 16.5, pitch: 55, bearing: -17 });
      render(
        <ApprovedIncidentMarkers
          incidents={[makeIncident({ location: { lat: 40.75, lng: -111.88 } })]}
        />
      );
      fireEvent.click(screen.getByTestId("marker"));
      fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));

      expect(mockMap.flyTo).toHaveBeenLastCalledWith(
        expect.objectContaining({ center: [-111.88, 40.75], zoom: 13, pitch: 0, bearing: 0 })
      );
    });
  });
});
