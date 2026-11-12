import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import TourInvite, { TOUR_INVITE_KEY } from "@/components/landing/TourInvite";

jest.mock("lucide-react", () => ({
  MousePointerClick: () => <svg />,
  X: () => <svg />,
}));

let mockAuth = { isLoggedIn: false, isLoading: false };
jest.mock("@/lib/auth", () => ({
  useAuth: () => mockAuth,
}));

const mockStartTour = jest.fn();
jest.mock("@/components/landing/HomeTour", () => ({
  useHomeTour: () => ({ start: mockStartTour, active: false }),
}));

beforeEach(() => {
  jest.useFakeTimers();
  window.localStorage.clear();
  mockStartTour.mockReset();
  mockAuth = { isLoggedIn: false, isLoading: false };
});

afterEach(() => {
  jest.useRealTimers();
});

const invite = () => screen.queryByRole("dialog", { name: /quick tour/i });
const waitAWhile = () => act(() => jest.advanceTimersByTime(3000));

describe("TourInvite", () => {
  it("asks a logged-out visitor, after a moment", () => {
    render(<TourInvite />);
    expect(invite()).not.toBeInTheDocument();
    waitAWhile();
    expect(invite()).toBeInTheDocument();
  });

  it("waits until the homepage is ready (the globe intro has finished)", () => {
    const { rerender } = render(<TourInvite ready={false} />);
    waitAWhile();
    expect(invite()).not.toBeInTheDocument();
    rerender(<TourInvite ready />);
    waitAWhile();
    expect(invite()).toBeInTheDocument();
  });

  it("never asks someone who's logged in", () => {
    mockAuth = { isLoggedIn: true, isLoading: false };
    render(<TourInvite />);
    waitAWhile();
    expect(invite()).not.toBeInTheDocument();
  });

  it("Yes starts the homepage tour, and remembers", () => {
    render(<TourInvite />);
    waitAWhile();
    fireEvent.click(screen.getByRole("button", { name: "Yes, show me" }));
    expect(mockStartTour).toHaveBeenCalled();
    expect(invite()).not.toBeInTheDocument();
    expect(window.localStorage.getItem(TOUR_INVITE_KEY)).toBe("yes");
  });

  it("No puts it away for good", () => {
    const { unmount } = render(<TourInvite />);
    waitAWhile();
    fireEvent.click(screen.getByRole("button", { name: "No thanks" }));
    expect(invite()).not.toBeInTheDocument();
    expect(window.localStorage.getItem(TOUR_INVITE_KEY)).toBe("no");
    expect(mockStartTour).not.toHaveBeenCalled();

    // Next visit: not asked again.
    unmount();
    render(<TourInvite />);
    waitAWhile();
    expect(invite()).not.toBeInTheDocument();
  });

  it("closing it counts as no", () => {
    render(<TourInvite />);
    waitAWhile();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(invite()).not.toBeInTheDocument();
    expect(window.localStorage.getItem(TOUR_INVITE_KEY)).toBe("no");
  });
});
