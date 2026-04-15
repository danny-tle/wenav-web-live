import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VerifyPage from "@/app/signup/verify/page";

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("email=danny%40test.com"),
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("next/image", () => {
  const MockImage = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img {...props} />
  );
  MockImage.displayName = "MockImage";
  return MockImage;
});

jest.mock("lucide-react", () => ({
  ArrowLeft: () => <svg data-testid="arrow-left" />,
}));

jest.mock("@/lib/auth", () => ({
  useAuth: () => ({
    sendVerification: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock("@/lib/firebase", () => ({
  auth: { currentUser: null },
  functions: {},
}));

jest.mock("firebase/functions", () => ({
  httpsCallable: () => jest.fn().mockResolvedValue({ data: { success: true } }),
}));

describe("Email verification page", () => {
  it("displays the email from query params", () => {
    render(<VerifyPage />);
    expect(screen.getByText("danny@test.com")).toBeInTheDocument();
  });

  it("renders 6 code input boxes", () => {
    render(<VerifyPage />);
    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(6);
  });

  it("submit button is disabled when code is incomplete", () => {
    render(<VerifyPage />);
    const button = screen.getByText("Create an account");
    expect(button).toBeDisabled();
  });

  it("auto-advances focus to next input on digit entry", async () => {
    const user = userEvent.setup();
    render(<VerifyPage />);
    const inputs = screen.getAllByRole("textbox");

    await user.click(inputs[0]);
    await user.keyboard("1");

    expect(inputs[0]).toHaveValue("1");
    expect(inputs[1]).toHaveFocus();
  });

  it("moves focus back on backspace when current input is empty", async () => {
    const user = userEvent.setup();
    render(<VerifyPage />);
    const inputs = screen.getAllByRole("textbox");

    await user.click(inputs[0]);
    await user.keyboard("1");
    await user.keyboard("2");
    // Now on input[2], backspace clears input[2] value first
    await user.keyboard("{Backspace}");
    // Now input[2] is empty, backspace moves focus back to input[1]
    await user.keyboard("{Backspace}");

    expect(inputs[1]).toHaveFocus();
  });

  it("enables submit button when all 6 digits are filled", async () => {
    const user = userEvent.setup();
    render(<VerifyPage />);
    const inputs = screen.getAllByRole("textbox");

    await user.click(inputs[0]);
    await user.keyboard("123456");

    const button = screen.getByText("Create an account");
    expect(button).not.toBeDisabled();
  });

  it("only accepts numeric input", async () => {
    const user = userEvent.setup();
    render(<VerifyPage />);
    const inputs = screen.getAllByRole("textbox");

    await user.click(inputs[0]);
    await user.keyboard("abc");

    expect(inputs[0]).toHaveValue("");
  });

  it("handles paste of full code", async () => {
    render(<VerifyPage />);
    const inputs = screen.getAllByRole("textbox");

    fireEvent.paste(inputs[0], {
      clipboardData: { getData: () => "694201" },
    });

    expect(inputs[0]).toHaveValue("6");
    expect(inputs[1]).toHaveValue("9");
    expect(inputs[2]).toHaveValue("4");
    expect(inputs[3]).toHaveValue("2");
    expect(inputs[4]).toHaveValue("0");
    expect(inputs[5]).toHaveValue("1");
  });

  it("has a back link to signup page", () => {
    render(<VerifyPage />);
    const backLink = screen.getByRole("link");
    expect(backLink).toHaveAttribute("href", "/signup");
  });

  it("has a resend code button", () => {
    render(<VerifyPage />);
    expect(screen.getByText("Resend code")).toBeInTheDocument();
  });
});
