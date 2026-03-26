import Image from "next/image";
import { NAV_LINKS } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="bg-wenav-dark text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Image
              src="/assets/logo.png"
              alt="WeNav"
              width={100}
              height={30}
              className="invert"
            />
            <span className="text-white/50 text-sm">
              Navigate safer. Stay connected.
            </span>
          </div>

          <div className="flex gap-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-white/40">
          &copy; {new Date().getFullYear()} WeNav. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
