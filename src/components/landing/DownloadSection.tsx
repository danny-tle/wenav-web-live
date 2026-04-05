import Image from "next/image";

export default function DownloadSection() {
  return (
    <section id="download" className="py-20 bg-[#f3f3f7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-black mb-12">
          Navigate safer. Stay connected.
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Admin / Caregiver / Web Dashboard */}
          <div className="rounded-[32px] bg-[#1E66F5] text-white p-8 flex flex-col">
            <div className="inline-flex w-fit rounded-full bg-white text-black text-sm px-6 py-2 mb-8">
              Admin / Caregiver / Dashboard
            </div>

            <div className="mb-8">
              <p className="text-white/90 text-sl mb-2">Desktop</p>
              <h3 className="text-4xl font-medium leading-snug mb-5">PC/Mac</h3>
              <p className="text-white/90 text-base leading-snug max-w-[320px]">
                Stay ahead with quick adaptable communication strategies for
                evolving business landscapes.
              </p>
            </div>

            <div className="mt-auto">
              <button className="rounded-full bg-white text-black px-8 py-3 text-medium font-medium hover:bg-white/90 transition">
                Login
              </button>
            </div>
          </div>

          {/* Primary User / iOS */}
          <div className="rounded-[32px] bg-[#ffffff] p-8 min-h-[420px] flex flex-col">
            <div className="inline-flex w-fit rounded-full bg-[#ECECEC] text-black text-sm px-6 py-2 mb-8">
              Primary User / iOS
            </div>

            <div className="mb-8">
              <p className="text-black/80 text-sl mb-2">Mobile Phone</p>
              <h3 className="text-4xl font-medium leading-snug mb-5 text-black">
                iOS
              </h3>
              <p className="text-black/70 text-base leading-snug max-w-[320px]">
                Stay ahead with quick adaptable communication strategies for
                evolving business landscapes.
              </p>
            </div>

            <div className="mt-auto">
              <Image
                src="/assets/appstore_badge.png"
                alt="Download on the App Store"
                width={140}
                height={42}
                className="h-auto"
              />
            </div>
          </div>

          {/* Primary User / Android */}
          <div className="rounded-[32px] bg-[#ffffff] p-8 min-h-[420px] flex flex-col">
            <div className="inline-flex w-fit rounded-full bg-[#ECECEC] text-black text-sm px-6 py-2 mb-8">
              Primary User / Android
            </div>

            <div className="mb-8">
              <p className="text-black/80 text-sl mb-2">Mobile Phone</p>
              <h3 className="text-4xl font-medium leading-snug mb-5 text-black">
                Android
              </h3>
              <p className="text-black/70 text-base leading-snug max-w-[320px]">
                Stay ahead with quick adaptable communication strategies for
                evolving business landscapes.
              </p>
            </div>

            <div className="mt-auto">
              <Image
                src="/assets/googleplay_badge.png"
                alt="Get it on Google Play"
                width={160}
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