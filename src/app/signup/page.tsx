"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { User, Mail, Lock } from "lucide-react";
import AuthInput from "@/components/shared/AuthInput";
import Button from "@/components/shared/Button";
import { useAuth } from "@/lib/auth";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all required fields");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!agreedToTerms) {
      setError("Please agree to the terms & conditions");
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(email, password, name);
      router.push(`/signup/verify?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/email-already-in-use") {
        setError("An account with this email already exists");
      } else if (code === "auth/weak-password") {
        setError("Password is too weak");
      } else {
        setError("Something went wrong. Please try again");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left photo panel */}
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

      {/* Right form panel */}
      <div className="w-full lg:w-[55%] flex-shrink-0 flex flex-col px-20 py-8">
        {/* Logo centered */}
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/assets/logo.png"
            alt="WeNav"
            width={110}
            height={33}/>
        </Link>

        {/* Form */}
        <div className="flex flex-col max-w-[500px] mx-auto w-full mt-40">
          <h1 className="text-4xl font-bold text-wenav-dark mb-3">
            Create account
          </h1>
          <p className="text-sm text-gray-400 mb-8">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-wenav-dark font-medium hover:underline">
              Log in
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="space-y-8">
              <AuthInput
                id="name"
                label="Name"
                value={name}
                onChange={setName}
                placeholder="Enter your name"
                icon={User}
              />

              <AuthInput
                id="email"
                label="Email ID"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="Enter your email"
                icon={Mail}
              />

              <AuthInput
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
                icon={Lock}
              />
            </div>

            <div className="min-h-[20px]">
              {error && (
                <p className="text-red-400 text-sm font-medium">{error}</p>
              )}
            </div>

            {/* Terms checkbox */}
            <div className="space-y-3 mt-10">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-5 h-5 rounded ml-1 border-gray-300 text-wenav-dark focus:ring-wenav-dark"
                />
                <span className=" text-gray-500">
                  I agree with terms & conditions
                </span>
              </label>
            </div>

            <div className="mt-40"> 
              <Button
              type="submit"
              label={isSubmitting ? "Creating account..." : "Verify your email"}
              variant="filled"
              disabled={isSubmitting}
              className="space-y-3 mt-4"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
