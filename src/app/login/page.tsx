"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { Mail, Lock } from "lucide-react";
import AuthInput from "@/components/shared/AuthInput";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const role = await login(email, password);
      if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") {
        setError("Invalid email or password");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Try again later");
      } else {
        setError("Something went wrong. Please try again");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left form panel */}
      <div className="w-full lg:w-[55%] flex-shrink-0 flex flex-col px-20 py-8">
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
        <div className="flex flex-col max-w-[500px] mx-auto w-full mt-20">
          <h1 className="text-4xl font-bold text-wenav-dark mb-10">
            Welcome Back!
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AuthInput
              id="email"
              label="Email ID"
              value={email}
              onChange={setEmail}
              placeholder="example@gmail.com"
              icon={Mail}
            />

            <div>
              <AuthInput
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
                icon={Lock}
              />

              {/* Error && Forgot Password? */}
              <div className="mt-1.5 flex items-center justify-between mb-6" >
                <div>
                  {error && ( <p className="text-red-400 text-sm">{error}</p>
                  )}
                </div>

                <div className="text-right">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-gray-400 hover:text-gray-600">
                    forgot password?
                  </Link>
                </div>
              </div>

            </div>

            {/* Log in button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-wenav-dark text-white font-semibold rounded-lg hover:bg-wenav-dark/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Logging in..." : "Log in"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or continue with</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* SSO Buttons */}
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center gap-3 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Continue with Google</span>
            </button>

            <button className="w-full flex items-center justify-center gap-3 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Continue with Apple</span>
            </button>
          </div>

          {/* Sign up link */}
          <p className="mt-8 text-center text-sm text-gray-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-wenav-dark font-semibold hover:underline"
            >
              Sign up
            </Link>
          </p>
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
