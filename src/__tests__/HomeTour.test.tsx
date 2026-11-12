import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { HomeTourProvider, useHomeTour } from "@/components/landing/HomeTour";
import { HOME_TOUR_STEPS } from "@/components/landing/homeTourSteps";
import { tourSignal } from "@/lib/tourSignal";

// Any lucide icon renders as a plain svg.
jest.mock("lucide-react", () =>
  new Proxy(
    {},
    {
      get: (_target, name) => {
        const Icon = () => <svg data-icon={String(name)} />;
        Icon.displayName = String(name);
        return Icon;
      },
    }
  )
);

function StartButton() {
  const { start, active } = useHomeTour();
  return (
    <button onClick={start} data-active={active}>
      Take the tour
    </button>
  );
}

function renderTour() {
  render(
    <HomeTourProvider>
      <StartButton />
    </HomeTourProvider>
  );
}

const click = (name: RegExp | string) => fireEvent.click(screen.getByRole("button", { name }));
const stepIndex = (id: string) => HOME_TOUR_STEPS.findIndex((s) => s.id === id);

describe("HomeTour", () => {
  it("stays out of the way until a visitor asks for it", () => {
    renderTour();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    click("Take the tour");
    expect(screen.getByRole("dialog", { name: HOME_TOUR_STEPS[0].title })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Take the tour" })).toHaveAttribute("data-active", "true");
  });

  it("walks through every step, each skippable, and closes at the end", () => {
    renderTour();
    click("Take the tour");
    HOME_TOUR_STEPS.forEach((step, i) => {
      expect(screen.getByRole("dialog", { name: step.title })).toBeInTheDocument();
      expect(screen.getByText(`${i + 1} of ${HOME_TOUR_STEPS.length}`)).toBeInTheDocument();
      click(step.action ? "Skip step" : /^(next|finish)/i);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("counts opening a pin when the map says so", () => {
    renderTour();
    click("Take the tour");
    for (let i = 0; i < stepIndex("pin"); i++) click("Skip step");
    expect(screen.getByText("Try it: click a red pin.")).toBeInTheDocument();

    // A signal for some other step doesn't count.
    act(() => tourSignal("search-picked"));
    expect(screen.queryByRole("button", { name: /^next/i })).not.toBeInTheDocument();

    act(() => tourSignal("pin-opened"));
    expect(screen.getByText(/you're at street level/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^next/i })).toBeInTheDocument();
  });

  it("counts a search once they pick a result", () => {
    renderTour();
    click("Take the tour");
    for (let i = 0; i < stepIndex("search"); i++) click("Skip step");
    act(() => tourSignal("search-picked"));
    expect(screen.getByText("The map flew straight there.")).toBeInTheDocument();
  });

  it("can be skipped, or stepped back through", () => {
    renderTour();
    click("Take the tour");
    click("Skip step");
    click(/back/i);
    expect(screen.getByRole("dialog", { name: HOME_TOUR_STEPS[0].title })).toBeInTheDocument();
    click(/skip tour/i);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
