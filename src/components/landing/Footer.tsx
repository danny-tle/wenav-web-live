import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black text-white pt-8">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* top area */}
        <div className="flex flex-col lg:flex-row lg:justify-between gap-16">
          
          {/* left */}
          <div className="max-w-sm">
            <Image
              src="/assets/logo.png"
              alt="WeNav"
              width={160}
              height={48}
              className="mb-8 invert"
            />

            <p className="text-white text-[15px] leading-[1.5] mb-10">
              WeNav helps visually impaired users detect obstacles, report hazards,
              and share safety information with caregivers.
            </p>

            <p className="text-white text-[15px] mb-2">
              © 2026 WeNav Project. All rights reserved.
            </p>

            <div className="flex items-center gap-2 text-white text-[16px] mb-14">
              <a href="#" className="hover:opacity-80 transition-opacity">
                Privacy Policy
              </a>
              <span>/</span>
              <a href="#" className="hover:opacity-80 transition-opacity">
                Terms & Conditions
              </a>
            </div>
          </div>

          {/* right */}
          <div className="flex gap-16 sm:gap-24 lg:gap-32">
            
            <div>
              <h3 className="text-cyan-400 text-[18px] mb-8">Pages</h3>
              <ul className="space-y-3 text-[18px]">
                <li>
                  <a href="#home" className="hover:opacity-80 transition-opacity">
                    Home
                  </a>
                </li>
                <li>
                  <a href="#content" className="hover:opacity-80 transition-opacity">
                    Overview
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:opacity-80 transition-opacity">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#team" className="hover:opacity-80 transition-opacity">
                    Meet the Team
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-cyan-400 text-[18px] mb-8">Download App</h3>
              <ul className="space-y-3 text-[18px]">
                <li>
                  <a href="#" className="hover:opacity-80 transition-opacity">
                    ios
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:opacity-80 transition-opacity">
                    android
                  </a>
                </li>
                <li>
                  <Link href="/login" className="hover:opacity-80 transition-opacity">
                    login
                  </Link>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* big logo bottom
        <div className="mt-10 flex justify-center">
          <Image
            src="/assets/logo.png"
            alt="WeNav"
            width={640}
            height={180}
            className="invert w-full max-w-[560px] h-auto"
          />
        </div> */}
      </div>
    </footer>
  );
}