"use client";

import Image from "next/image";
import { FEATURES } from "@/lib/constants";
import { ChevronRight } from "lucide-react";
import { useLoopingCarousel } from "./useLoopingCarousel";

export default function FeaturesSection() {
  const carousel = useLoopingCarousel(FEATURES.length, { interval: 2000 });

  return (
    <section id="features" className="py-20 lg:py-24 bg-[#f7f6fb]">
      <div
        {...carousel.pauseProps}
        role="region"
        aria-roledescription="carousel"
        aria-label="Features"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-6 mb-12 lg:mb-16">
            <div>
              <h2 className="text-3xl sm:text-[32px] font-medium text-wenav-dark mb-4">
                Features
              </h2>
              <p className="text-wenav-dark">
                Built to protect, alert, and support when it matters most.
              </p>
            </div>

            <button
              type="button"
              onClick={carousel.next}
              className="shrink-0 mt-12 p-2 rounded-full bg-black/10 text-wenav-dark hover:bg-black/15 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wenav-violet"
              aria-label="Next feature"
            >
              <ChevronRight size={22} strokeWidth={1.5} />
            </button>
          </div>
          <div className="overflow-hidden">
            <div
              ref={carousel.trackRef}
              className="relative flex gap-5 will-change-transform"
              style={carousel.trackStyle}
              aria-live="off"
            >
              {carousel.slots.map((slot) => {
                const feature = FEATURES[carousel.itemAt(slot)];
                const clone = carousel.isClone(slot);
                return (
                  <div
                    key={slot}
                    role={clone ? undefined : "group"}
                    aria-roledescription={clone ? undefined : "slide"}
                    aria-label={
                      clone
                        ? undefined
                        : `${carousel.itemAt(slot) + 1} of ${FEATURES.length}`
                    }
                    aria-hidden={clone || undefined}
                    className="shrink-0 w-full sm:w-[calc((100%-20px)/2)] lg:w-[calc((100%-60px)/4)] min-h-[340px] lg:min-h-[372px] bg-white rounded-[12px] p-6 lg:p-5"
                  >
                    <Image
                      src={feature.icon}
                      alt=""
                      width={22}
                      height={22}
                      className="mb-8 mt-6"
                    />
                    <h3 className="text-[20px] leading-snug font-medium text-wenav-dark mb-3 whitespace-pre-line">
                      {feature.title}
                    </h3>
                    <p className="text-gray-500 text-[15px] leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
