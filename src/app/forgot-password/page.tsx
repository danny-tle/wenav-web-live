"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
import AuthInput from "@/components/shared/AuthInput";
import Button from "@/components/shared/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    setSubmitted(true);
  };

  const handleResend = () => {
    // Will connect to Firebase password reset later
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left form panel */}
      <div className="w-full lg:w-[55%] flex-shrink-0 flex flex-col px-8 lg:px-20 py-10">
        {/* Logo */}
        <Image
          src="/assets/logo.png"
          alt="WeNav"
          width={110}
          height={33}
          className="mb-12"
        />

        {/* Form */}
        <div className="flex-1 flex flex-col justify-center max-w-[400px] mx-auto w-full">
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
              <button
                onClick={handleResend}
                className="text-sm text-wenav-dark font-semibold hover:underline"
              >
                Resend link
              </button>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  ← Back to login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <AuthInput
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="Enter your email"
                icon={Mail}
              />

              {error && (
                <p className="text-red-500 text-sm font-medium">{error}</p>
              )}

              <Button
                type="submit"
                label="Send password reset link"
                variant="filled"
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
