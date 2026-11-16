import Image from "next/image";

// `id="content"` keeps the navbar's "Info" link and the footer's "Overview"
// link pointing at the first section under the map.
export default function IntroSection() {
  return (
    <section id="content" className="bg-white py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div>
          <p className="text-wenav-violet text-lg mb-2">WeNav</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-wenav-dark leading-[1.15] tracking-tight max-w-[440px] mb-6">
            Navigate with confidence. Stay connected to care.
          </h1>
          <p className="text-[17px] leading-relaxed text-wenav-dark max-w-[520px] mb-10">
            A wearable sensor belt, a mobile app and a caregiver dashboard that
            work together to support people with visual impairments.
          </p>
          <div className="flex flex-wrap gap-5">
            <a
              href="#tutorial"
              className="inline-flex items-center rounded-full bg-wenav-violet px-5 py-3.5 text-lg font-medium text-white hover:bg-wenav-violet/90 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wenav-violet"
            >
              Watch Tutorial
            </a>
            <a
              href="#download"
              className="inline-flex items-center rounded-full border-2 border-wenav-violet px-8 py-3 text-lg font-medium text-wenav-dark hover:bg-wenav-violet/5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wenav-violet"
            >
              Download
            </a>
          </div>
        </div>

        <div className="relative w-full aspect-[552/430] rounded-[40px] overflow-hidden lg:justify-self-end lg:max-w-[552px]">
          <Image
            src="/assets/hero_walker.jpg"
            alt="A woman with a white cane walks down a sunny city sidewalk wearing a chest harness that holds her phone."
            fill
            sizes="(min-width: 1024px) 552px, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
