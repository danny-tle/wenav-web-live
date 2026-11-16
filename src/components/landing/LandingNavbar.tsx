"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { NAV_LINKS } from "@/lib/constants";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function LandingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isLoggedIn, isLoading, role } = useAuth();

  const myPageHref = role === "admin" ? "/admin" : "/dashboard";

  return (
    <nav className="fixed top-0 left-0 right-0 z-[2000] bg-white border-b border-gray-100">
      <div className="px-4 sm:px-6 lg:px-[6%]">
        <div className="flex items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/assets/logo.png"
              alt="WeNav"
              width={96}
              height={38}
              priority
            />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-8 xl:gap-10 ml-12 xl:ml-[90px]">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[15px] text-wenav-dark hover:text-wenav-violet transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Login button / My Page button*/}
          <div className="hidden lg:flex lg:items-center lg:gap-2 ml-auto">
            {!isLoading && (
              <Link
                href={isLoggedIn ? myPageHref : "/login"}
                data-tour="home-account"
                className="px-5 py-1.5 bg-wenav-dark text-white text-[15px] font-medium rounded-full hover:bg-wenav-dark/85 transition-colors"
              >
              {isLoggedIn ? "My Page":"Login"}
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 ml-auto"
            // On phones the Login button lives behind this menu.
            data-tour="home-account"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 pb-4">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block py-3 text-[15px] text-wenav-dark hover:text-wenav-violet"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/login"
            className="block mt-3 px-5 py-2.5 bg-wenav-dark text-white text-[15px] font-medium rounded-full text-center"
          >
            Login
          </Link>
        </div>
      )}
    </nav>
  );
}
