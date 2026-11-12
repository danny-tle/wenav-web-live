import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { OnboardingProvider, useOnboarding } from "@/components/onboarding/OnboardingProvider";
import TourSpotlight, { placeCard } from "@/components/onboarding/TourSpotlight";
import { TOUR_STEPS } from "@/components/onboarding/tourSteps";
import {
  NEW_ACCOUNT_WINDOW_MS,
  hasCompletedOnboarding,
  isNewAccount,
  markOnboardingComplete,
} from "@/lib/onboarding";

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

let mockLinks: { userName: string }[] = [];
const mockRedeem = jest.fn();
jest.mock("@/lib/firestore", () => ({
  subscribeToMyLinks: (_uid: string, cb: (links: { userName: string }[]) => void) => {
    cb(mockLinks);
    return () => {};
  },
  redeemPairingCode: (code: string) => mockRedeem(code),
}));

type MockUser = { uid: string; displayName: string; metadata: { creationTime?: string } };
let mockAuth: { user: MockUser | null; role: "user" | "admin" | null };
jest.mock("@/lib/auth", () => ({
  useAuth: () => mockAuth,
}));

const mockPush = jest.fn();
let mockPathname = "/dashboard";
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
}));

const justNow = () => new Date().toUTCString();
const longAgo = () => new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toUTCString();

beforeEach(() => {
  window.localStorage.clear();
  mockLinks = [];
  mockRedeem.mockReset();
  mockPush.mockReset();
  mockPathname = "/dashboard";
  mockAuth = {
    user: { uid: "u1", displayName: "Jamie Rivera", metadata: { creationTime: justNow() } },
    role: "user",
  };
});

const click = (name: RegExp | string) => fireEvent.click(screen.getByRole("button", { name }));

describe("isNewAccount", () => {
  const now = Date.parse("2026-11-11T12:00:00Z");

  it("is true for an account made in the last week", () => {
    expect(isNewAccount("Wed, 11 Nov 2026 09:00:00 GMT", now)).toBe(true);
  });

  it("is false once the week is up, or without a creation time", () => {
    expect(isNewAccount(new Date(now - NEW_ACCOUNT_WINDOW_MS - 1).toUTCString(), now)).toBe(false);
    expect(isNewAccount(undefined, now)).toBe(false);
    expect(isNewAccount("not a date", now)).toBe(false);
  });
});

describe("placeCard", () => {
  const viewport = { width: 1200, height: 800 };
  const card = { width: 360, height: 200 };

  it("puts the card under the highlighted thing when there's room", () => {
    const pos = placeCard({ top: 100, left: 500, width: 200, height: 40 }, card, viewport);
    expect(pos.top).toBeGreaterThan(140);
  });

  it("puts it above when the thing is near the bottom", () => {
    const pos = placeCard({ top: 700, left: 500, width: 200, height: 40 }, card, viewport);
    expect(pos.top + card.height).toBeLessThan(700);
  });

  it("puts it beside a tall sidebar", () => {
    const pos = placeCard({ top: 0, left: 0, width: 80, height: 800 }, card, viewport);
    expect(pos.left).toBeGreaterThan(80);
  });

  it("keeps it on screen when the thing fills the screen", () => {
    const pos = placeCard({ top: 0, left: 0, width: 1200, height: 800 }, card, viewport);
    expect(pos.top).toBeGreaterThanOrEqual(16);
    expect(pos.top + card.height).toBeLessThanOrEqual(800 - 16);
    expect(pos.left).toBeGreaterThanOrEqual(16);
  });
});

describe("OnboardingWizard intro", () => {
  it("greets the caregiver by first name and starts the walkthrough", () => {
    const onStart = jest.fn();
    render(<OnboardingWizard stage="intro" uid="u1" displayName="Jamie Rivera" onStart={onStart} onClose={jest.fn()} />);
    expect(screen.getByRole("dialog", { name: "Welcome to WeNav, Jamie" })).toBeInTheDocument();
    click(/show me around/i);
    expect(onStart).toHaveBeenCalled();
  });

  it("can be skipped by button or Escape", () => {
    const onClose = jest.fn();
    render(<OnboardingWizard stage="intro" uid="u1" displayName="Jamie" onClose={onClose} />);
    click(/skip tour/i);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe("OnboardingWizard outro", () => {
  it("offers to connect someone, and can be put off", () => {
    const onClose = jest.fn();
    render(<OnboardingWizard stage="outro" uid="u1" displayName="Jamie" onClose={onClose} />);
    expect(screen.getByRole("heading", { name: /connect someone/i })).toBeInTheDocument();
    click(/i'll do this later/i);
    expect(screen.getByRole("heading", { name: "You're all set" })).toBeInTheDocument();
    click("Go to my dashboard");
    expect(onClose).toHaveBeenCalled();
  });

  it("pairs with a code", async () => {
    mockRedeem.mockResolvedValue("Sam");
    render(<OnboardingWizard stage="outro" uid="u1" displayName="Jamie" onClose={jest.fn()} />);
    fireEvent.change(screen.getByLabelText("Pairing code, 6 characters"), { target: { value: "ABC123" } });
    await waitFor(() => expect(screen.getByText("Sam")).toBeInTheDocument());
    expect(mockRedeem).toHaveBeenCalledWith("ABC123");
    expect(screen.getByRole("heading", { name: "You're connected" })).toBeInTheDocument();
  });

  it("shows why a code was rejected", async () => {
    mockRedeem.mockRejectedValue(new Error("boom"));
    render(<OnboardingWizard stage="outro" uid="u1" displayName="Jamie" onClose={jest.fn()} />);
    fireEvent.change(screen.getByLabelText("Pairing code, 6 characters"), { target: { value: "ABC123" } });
    expect(await screen.findByRole("alert")).toHaveTextContent(/pairing failed/i);
  });

  it("skips straight to the send-off when they're already connected", () => {
    mockLinks = [{ userName: "Ana" }];
    render(<OnboardingWizard stage="outro" uid="u1" displayName="Jamie" onClose={jest.fn()} />);
    expect(screen.getByRole("heading", { name: "You're all set" })).toBeInTheDocument();
  });
});

function ReplayButton() {
  const { startTour } = useOnboarding();
  return <button onClick={startTour}>Replay</button>;
}

function renderProvider() {
  return render(
    <OnboardingProvider>
      <ReplayButton />
    </OnboardingProvider>
  );
}

describe("OnboardingProvider", () => {
  it("opens by itself for a brand-new caregiver", () => {
    renderProvider();
    expect(screen.getByRole("dialog", { name: /welcome to wenav/i })).toBeInTheDocument();
  });

  it("doesn't spring itself on people who signed up before it existed", () => {
    mockAuth.user!.metadata.creationTime = longAgo();
    renderProvider();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("only opens by itself once", () => {
    markOnboardingComplete("u1");
    renderProvider();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("never shows to admins", () => {
    mockAuth.role = "admin";
    renderProvider();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("remembers a skipped tour", () => {
    renderProvider();
    click(/skip tour/i);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(hasCompletedOnboarding("u1")).toBe(true);
  });

  it("walks through every step, each skippable, then wraps up", () => {
    renderProvider();
    click(/show me around/i);

    TOUR_STEPS.forEach((step, i) => {
      expect(screen.getByRole("dialog", { name: step.title })).toBeInTheDocument();
      expect(screen.getByText(`${i + 1} of ${TOUR_STEPS.length}`)).toBeInTheDocument();
      if (step.action) {
        // Hands-on steps wait for them to try it, but never trap them.
        expect(screen.getByText(step.action.hint)).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /^next/i })).not.toBeInTheDocument();
        click("Skip step");
      } else {
        click(i === TOUR_STEPS.length - 1 ? "Finish" : /^next/i);
      }
    });

    // Not connected to anyone yet, so the outro offers to fix that.
    expect(screen.getByRole("heading", { name: /connect someone/i })).toBeInTheDocument();
    click(/i'll do this later/i);
    click("Go to my dashboard");
    expect(mockPush).toHaveBeenLastCalledWith("/dashboard");
    expect(hasCompletedOnboarding("u1")).toBe(true);
  });

  it("takes them to each step's page when the step starts", () => {
    renderProvider();
    click(/show me around/i);
    // Skip ahead to the first step on My Users.
    const firstMyUsers = TOUR_STEPS.findIndex((s) => s.page === "/my-users");
    for (let i = 0; i < firstMyUsers; i++) click("Skip step");
    expect(mockPush).toHaveBeenLastCalledWith("/dashboard/my-users");
  });

  it("moves on by itself once they use the menu to change page, but not when going Back", () => {
    const navIndex = TOUR_STEPS.findIndex((s) => s.action?.type === "navigate");
    const navStep = TOUR_STEPS[navIndex];
    const to = navStep.action!.type === "navigate" ? navStep.action!.to : "";
    // A fresh element each time, or React skips the re-render entirely.
    const tree = () => (
      <OnboardingProvider>
        <ReplayButton />
      </OnboardingProvider>
    );

    const { rerender } = render(tree());
    click(/show me around/i);
    for (let i = 0; i < navIndex; i++) click("Skip step");
    expect(screen.getByRole("dialog", { name: navStep.title })).toBeInTheDocument();

    // They click the menu link.
    mockPathname = `/dashboard${to}`;
    rerender(tree());
    const after = TOUR_STEPS[navIndex + 1];
    expect(screen.getByRole("dialog", { name: after.title })).toBeInTheDocument();

    // Back onto the menu step, still on the new page: stays put.
    click(/back/i);
    rerender(tree());
    expect(screen.getByRole("dialog", { name: navStep.title })).toBeInTheDocument();
  });

  it("closes a window they opened when they move on", () => {
    const openIndex = TOUR_STEPS.findIndex((s) => s.action?.type === "open");
    const closeWindow = jest.fn();
    render(
      <OnboardingProvider>
        <button data-tour-close onClick={closeWindow}>
          Close window
        </button>
      </OnboardingProvider>
    );
    click(/show me around/i);
    for (let i = 0; i < openIndex; i++) click("Skip step");
    expect(closeWindow).not.toHaveBeenCalled();
    click("Skip step");
    expect(closeWindow).toHaveBeenCalledTimes(1);
  });

  it("doesn't jump back to the welcome when the signed-in user refreshes mid-tour", () => {
    const { rerender } = renderProvider();
    click(/show me around/i);
    // e.g. updateName() swaps in a new user object.
    mockAuth = { ...mockAuth, user: { ...mockAuth.user!, metadata: { creationTime: justNow() } } };
    rerender(
      <OnboardingProvider>
        <ReplayButton />
      </OnboardingProvider>
    );
    expect(screen.getByRole("dialog", { name: TOUR_STEPS[0].title })).toBeInTheDocument();
  });

  it("goes back a step", () => {
    renderProvider();
    click(/show me around/i);
    click("Skip step");
    click(/back/i);
    expect(screen.getByRole("dialog", { name: TOUR_STEPS[0].title })).toBeInTheDocument();
  });

  it("can be started again from Settings, even for an older account", () => {
    mockAuth.user!.metadata.creationTime = longAgo();
    renderProvider();
    act(() => {
      click("Replay");
    });
    expect(screen.getByRole("dialog", { name: /welcome to wenav/i })).toBeInTheDocument();
  });
});

describe("TourSpotlight hands-on steps", () => {
  /** A visible element tagged for the tour (jsdom has no layout, so fake a size). */
  function addTarget(name: string) {
    const el = document.createElement("div");
    el.setAttribute("data-tour", name);
    el.getBoundingClientRect = () =>
      ({ top: 100, left: 100, width: 200, height: 50, right: 300, bottom: 150, x: 100, y: 100, toJSON: () => ({}) }) as DOMRect;
    el.scrollIntoView = jest.fn();
    document.body.appendChild(el);
    return el;
  }

  afterEach(() => {
    document.querySelectorAll("[data-tour]").forEach((el) => el.remove());
  });

  const props = { index: 1, total: 5, onNext: jest.fn(), onBack: jest.fn(), onSkip: jest.fn() };

  it("counts a click on the highlighted thing", async () => {
    const el = addTarget("thing");
    const onDone = jest.fn();
    render(
      <TourSpotlight
        {...props}
        step={{ id: "s", target: "thing", title: "T", body: "B", action: { type: "click", hint: "Try it", done: "Nice" } }}
        done={false}
        onDone={onDone}
      />
    );
    await waitFor(() => {
      fireEvent.click(el);
      expect(onDone).toHaveBeenCalled();
    });
  });

  it("counts dragging or zooming the map", async () => {
    const el = addTarget("map");
    const onDone = jest.fn();
    render(
      <TourSpotlight
        {...props}
        step={{ id: "s", target: "map", title: "T", body: "B", action: { type: "interact", hint: "Drag", done: "Nice" } }}
        done={false}
        onDone={onDone}
      />
    );
    await waitFor(() => {
      fireEvent.wheel(el);
      expect(onDone).toHaveBeenCalled();
    });
  });

  it("shows the hint until it's done, then what happened and Next", () => {
    addTarget("thing");
    const step = {
      id: "s",
      target: "thing",
      title: "T",
      body: "B",
      action: { type: "click" as const, hint: "Try it: click a name.", done: "The map flew to them." },
    };
    const { rerender } = render(<TourSpotlight {...props} step={step} done={false} onDone={jest.fn()} />);
    expect(screen.getByText("Try it: click a name.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skip step" })).toBeInTheDocument();

    rerender(<TourSpotlight {...props} step={step} done onDone={jest.fn()} />);
    expect(screen.getByText("The map flew to them.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^next/i })).toBeInTheDocument();
  });
});
