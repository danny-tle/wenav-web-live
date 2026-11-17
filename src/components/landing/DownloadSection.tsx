import Image from "next/image";
import Link from "next/link";

export default function DownloadSection() {
  return (
    <section id="download" className="py-16 lg:py-[100px] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-[44px] font-medium text-black tracking-tight mb-12">
          Navigate safer. Stay connected.
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* Admin / Caregiver / Web Dashboard */}
          <div className="rounded-[32px] bg-[#1065FE] text-white p-8 min-h-[440px] flex flex-col">
            <div className="inline-flex w-fit rounded-full bg-white text-black text-sm px-5 py-2.5 mb-6">
              Admin / Caregiver / Web Dashboard
            </div>

            <div className="mt-14 mb-6">
              <p className="text-white/90 text-sm mb-2">Desktop</p>
              <h3 className="text-3xl font-medium leading-snug mb-4">PC/Mac</h3>
              <p className="text-white/90 text-sm leading-snug max-w-[280px]">
                Stay ahead with quick adaptable communication strategies for
                evolving business landscapes.
              </p>
            </div>

            <div className="mt-auto">
              <Link href="/login" className="inline-block rounded-full bg-white text-black px-12 py-3.5 text-base font-medium hover:bg-white/90 transition">
                Login
              </Link>

            </div>
          </div>

          {/* Primary User / iOS */}
          <div className="rounded-[32px] bg-[#f0f0f0] p-8 min-h-[440px] flex flex-col">
            <div className="inline-flex w-fit rounded-full bg-[#e4e4e4] text-black text-sm px-5 py-2.5 mb-6">
              Primary User / iOS
            </div>

            <div className="mt-14 mb-6">
              <p className="text-black/80 text-sm mb-2">Mobile Phone</p>
              <h3 className="text-3xl font-medium leading-snug mb-4 text-black">
                iOS
              </h3>
              <p className="text-black/70 text-sm leading-snug max-w-[280px]">
                Stay ahead with quick adaptable communication strategies for
                evolving business landscapes.
              </p>
            </div>

            <div className="mt-auto">
              <Image
                src="/assets/appstore_badge.png"
                alt="Download on the App Store"
                width={124}
                height={42}
                className="h-auto"
              />
            </div>
          </div>

          {/* Primary User / Android */}
          <div className="rounded-[32px] bg-[#f0f0f0] p-8 min-h-[440px] flex flex-col">
            <div className="inline-flex w-fit rounded-full bg-[#e4e4e4] text-black text-sm px-5 py-2.5 mb-6">
              Primary User / Android
            </div>

            <div className="mt-14 mb-6">
              <p className="text-black/80 text-sm mb-2">Mobile Phone / Tablet</p>
              <h3 className="text-3xl font-medium leading-snug mb-4 text-black">
                Android
              </h3>
              <p className="text-black/70 text-sm leading-snug max-w-[280px]">
                Stay ahead with quick adaptable communication strategies for
                evolving business landscapes.
              </p>
            </div>

            <div className="mt-auto">
              <Image
                src="/assets/googleplay_badge.png"
                alt="Get it on Google Play"
                width={142}
                height={48}
                className="h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
