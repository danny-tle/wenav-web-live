"use client";

import { useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/shared/Button";
import { useAuth } from "@/lib/auth";
import { auth, functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";

function VerifyForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { sendVerification } = useAuth();

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);
    const nextEmpty = pasted.length < 6 ? pasted.length : 5;
    inputRefs.current[nextEmpty]?.focus();
  };

  const isComplete = code.every((d) => d !== "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const verifyCode = httpsCallable(functions, "verifyEmailCode");
      await verifyCode({ code: code.join("") });
      // Refresh token so emailVerified is updated
      await auth.currentUser?.getIdToken(true);
      router.push("/login");
    } catch (err: unknown) {
      const message = (err as { message?: string }).message || "Verification failed. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-8 py-10">
      {/* Logo */}
      <Image
        src="/assets/logo.png"
        alt="WeNav"
        width={110}
        height={33}
        className="mb-16"
      />

      {/* Content */}
      <div className="w-full max-w-[400px]">
        {/* Back arrow */}
        <Link
          href="/signup"
          className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-8"
        >
          <ArrowLeft size={20} />
        </Link>

        <h1 className="text-4xl font-bold text-wenav-dark mb-3">
          Check your email
        </h1>
        <p className="text-sm text-gray-400 mb-8">
          We&apos;ve sent a 6-digit code to{" "}
          <span className="font-semibold text-gray-600">{email}</span> to
          verify your account
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Code inputs */}
          <div className="flex gap-3 justify-center" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-semibold border border-gray-300 rounded-lg outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            ))}
          </div>

          <Button
            type="submit"
            label={isSubmitting ? "Verifying..." : "Create an account"}
            variant="filled"
            disabled={!isComplete || isSubmitting}
          />
        </form>

        {error && (
          <p className="text-red-500 text-sm font-medium mt-4 text-center">{error}</p>
        )}

        <button
          type="button"
          onClick={async () => {
            try {
              await sendVerification();
              setResent(true);
            } catch {
              setError("Failed to resend. Please try again");
            }
          }}
          className="w-full text-center mt-4 text-sm text-wenav-dark font-semibold hover:underline"
        >
          {resent ? "Code resent!" : "Resend code"}
        </button>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      }
    >
      <VerifyForm />
    </Suspense>
  );
}
