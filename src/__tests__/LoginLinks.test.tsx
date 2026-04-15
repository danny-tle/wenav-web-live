import React from "react";
import { render, screen } from "@testing-library/react";
import LoginPage from "@/app/login/page";

jest.mock("next/image", () => {
  const MockImage = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img {...props} />
  );
  MockImage.displayName = "MockImage";
  return MockImage;
});

jest.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: null,
    login: jest.fn().mockResolvedValue("user"),
    signup: jest.fn(),
    isLoggedIn: false,
    isLoading: false,
    role: null,
    logout: jest.fn(),
    sendVerification: jest.fn(),
    resetPassword: jest.fn(),
    updateName: jest.fn(),
    changePassword: jest.fn(),
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("lucide-react", () => ({
  Mail: () => <svg data-testid="mail-icon" />,
  Lock: () => <svg data-testid="lock-icon" />,
}));

describe("Login page links", () => {
  it("has a link to the signup page", () => {
    render(<LoginPage />);
    const signupLink = screen.getByRole("link", { name: "Sign up" });
    expect(signupLink).toHaveAttribute("href", "/signup");
  });

  it("has a link to the forgot password page", () => {
    render(<LoginPage />);
    const forgotLink = screen.getByRole("link", { name: "forgot password?" });
    expect(forgotLink).toHaveAttribute("href", "/forgot-password");
  });
});
