"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const username = email.includes("@") ? email.split("@")[0] : email;
    const role = login(username, password);
    if (role === "admin") {
      router.push("/admin");
    } else if (role === "user") {
      router.push("/dashboard");
    } else {
      setError("Invalid email or password");
    }
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
          <h1 className="text-4xl font-bold text-wenav-dark mb-10">
            Welcome Back!
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email ID */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Email ID
              </label>
              <div
                className={`flex items-center border rounded-lg px-3 py-3 transition-colors ${
                  focusedField === "email"
                    ? "border-blue-500 ring-1 ring-blue-500"
                    : "border-gray-300"
                }`}
              >
                <Mail size={16} className="text-gray-400 mr-3 flex-shrink-0" />
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="example@gmail.com"
                  className="flex-1 outline-none text-sm text-gray-700 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Password
              </label>
              <div
                className={`flex items-center border rounded-lg px-3 py-3 transition-colors ${
                  focusedField === "password"
                    ? "border-blue-500 ring-1 ring-blue-500"
                    : "border-gray-300"
                }`}
              >
                <Lock size={16} className="text-gray-400 mr-3 flex-shrink-0" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your password"
                  className="flex-1 outline-none text-sm text-gray-700 placeholder:text-gray-400"
                />
              </div>
              <div className="text-right mt-1.5">
                <span className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                  forgot password?
                </span>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm font-medium">{error}</p>
            )}

            {/* Log in button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-wenav-dark text-white font-semibold rounded-lg hover:bg-wenav-dark/90 transition-colors"
            >
              Log in
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
            <span className="text-wenav-dark font-semibold cursor-pointer hover:underline">
              Sign up
            </span>
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
