import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignupPage from "@/app/signup/page";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("next/image", () => {
  const MockImage = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img {...props} />
  );
  MockImage.displayName = "MockImage";
  return MockImage;
});

jest.mock("lucide-react", () => ({
  User: () => <svg data-testid="user-icon" />,
  Mail: () => <svg data-testid="mail-icon" />,
  Lock: () => <svg data-testid="lock-icon" />,
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Signup page", () => {
  it("renders the form with all fields", () => {
    render(<SignupPage />);
    expect(screen.getByText("Create account")).toBeInTheDocument();
    expect(screen.getByLabelText("Name*")).toBeInTheDocument();
    expect(screen.getByLabelText("Email ID*")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByText("I agree with terms & conditions")).toBeInTheDocument();
    expect(screen.getByText("Verify your email")).toBeInTheDocument();
  });

  it("shows error when submitting with empty fields", async () => {
    const user = userEvent.setup();
    render(<SignupPage />);

    await user.click(screen.getByText("Verify your email"));

    expect(screen.getByText("Please fill in all required fields")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows error when password is less than 8 characters", async () => {
    const user = userEvent.setup();
    render(<SignupPage />);

    await user.type(screen.getByLabelText("Name*"), "Danny");
    await user.type(screen.getByLabelText("Email ID*"), "danny@test.com");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.click(screen.getByText("I agree with terms & conditions"));
    await user.click(screen.getByText("Verify your email"));

    expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows error when terms are not accepted", async () => {
    const user = userEvent.setup();
    render(<SignupPage />);

    await user.type(screen.getByLabelText("Name*"), "Danny");
    await user.type(screen.getByLabelText("Email ID*"), "danny@test.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByText("Verify your email"));

    expect(screen.getByText("Please agree to the terms & conditions")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("navigates to verify page on valid submission", async () => {
    const user = userEvent.setup();
    render(<SignupPage />);

    await user.type(screen.getByLabelText("Name*"), "Danny");
    await user.type(screen.getByLabelText("Email ID*"), "danny@test.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByText("I agree with terms & conditions"));
    await user.click(screen.getByText("Verify your email"));

    expect(mockPush).toHaveBeenCalledWith(
      "/signup/verify?email=danny%40test.com"
    );
  });

  it("has a link to the login page", () => {
    render(<SignupPage />);
    const loginLink = screen.getByRole("link", { name: "Log in" });
    expect(loginLink).toHaveAttribute("href", "/login");
  });
});
