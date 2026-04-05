"use client";

import { useRef } from "react";
import Image from "next/image";
import { FEATURES } from "@/lib/constants";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function FeaturesSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = 280;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section id="features" className="py-20 bg-[#f3f3f7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold text-black mb-3">
              Features
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Built to protect, alert, and support when it matters most.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => scroll("left")}
              className="p-2 rounded-full border border-gray-200 hover:bg-wenav-gray transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-2 rounded-full border border-gray-200 hover:bg-wenav-gray transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="shrink-0 w-[390px] min-h-[440px] bg-white rounded-[12px] p-10 snap-start"
            >
              <div className="mb-8">
                <Image
                  src={feature.icon}
                  alt={feature.title}
                  width={32}
                  height={32}
                />
              </div>

              <h3 className="text-[22px] leading-tight font-semibold text-black mb-3 whitespace-pre-line">
                {feature.title}
              </h3>

              <p className="text-gray-500 text-[16px] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}