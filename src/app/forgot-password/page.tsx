"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
import AuthInput from "@/components/shared/AuthInput";
import Button from "@/components/shared/Button";
import { useAuth } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(email);
      setSubmitted(true);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/user-not-found") {
        setError("No account found with this email");
      } else {
        setError("Something went wrong. Please try again");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    try {
      await resetPassword(email);
    } catch {
      setError("Failed to resend. Please try again");
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left form panel */}
      <div className="w-full lg:w-[55%] flex-shrink-0 flex flex-col px-8 lg:px-20 py-10">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/assets/logo.png"
            alt="WeNav"
            width={110}
            height={33}
          />
        </Link>


        {/* Form */}
        <div className="flex flex-col max-w-[500px] mx-auto w-full mt-40">
          <h1 className="text-4xl font-bold text-wenav-dark mb-2">
            Forgot Password?
          </h1>
          <p className="text-sm text-gray-400 mb-8">
            Don&apos;t worry, we will send you a password reset link
          </p>

          {submitted ? (
            <div className="space-y-5">
              <p className="text-sm text-gray-600">
                Password reset link sent to{" "}
                <span className="font-semibold">{email}</span>. Check your inbox.
              </p>

            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <AuthInput
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="Enter your email"
                icon={Mail}
                />

                <div className="min-h-[20px]">
                  {error && (
                    <p className="text-red-400 text-sm font-medium">{error}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                label={isSubmitting ? "Sending..." : "Send password reset link"}
                variant="filled"
                disabled={isSubmitting}
              />
            </form>
          )}
        </div>
      </div>

      {/* Right photo panel */}
      <div className="hidden lg:block lg:w-[45%] p-4">
        <div className="relative h-full w-full rounded-2xl overflow-hidden">
          <Image
            src="/assets/image.png"
            alt="People walking in a modern building"
            fill
            className="object-cover"
            sizes="45vw"
            priority
          />
        </div>
      </div>
    </div>
  );
}
