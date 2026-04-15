import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForgotPasswordPage from "@/app/forgot-password/page";

jest.mock("next/image", () => {
  const MockImage = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img {...props} />
  );
  MockImage.displayName = "MockImage";
  return MockImage;
});

jest.mock("lucide-react", () => ({
  Mail: () => <svg data-testid="mail-icon" />,
}));

describe("Forgot Password page", () => {
  it("renders the heading and subtitle", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByText("Forgot Password?")).toBeInTheDocument();
    expect(
      screen.getByText("Don't worry, we will send you a password reset link")
    ).toBeInTheDocument();
  });

  it("shows error when submitting with empty email", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    await user.click(screen.getByText("Send password reset link"));

    expect(screen.getByText("Please enter your email")).toBeInTheDocument();
  });

  it("shows success message after valid submission", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText("Email"), "danny@test.com");
    await user.click(screen.getByText("Send password reset link"));

    expect(
      screen.getByText(/Password reset link sent to/)
    ).toBeInTheDocument();
    expect(screen.getByText("danny@test.com")).toBeInTheDocument();
    expect(screen.getByText("Resend link")).toBeInTheDocument();
  });

  it("has a back to login link after submission", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText("Email"), "danny@test.com");
    await user.click(screen.getByText("Send password reset link"));

    const backLink = screen.getByRole("link", { name: /Back to login/ });
    expect(backLink).toHaveAttribute("href", "/login");
  });
});
