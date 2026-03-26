"use client";

import { useRef } from "react";
import Image from "next/image";
import { TEAM_MEMBERS } from "@/lib/constants";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function TeamSection() {
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
    <section id="team" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-bold text-wenav-dark">
            Meet our Team
          </h2>
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
          className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {TEAM_MEMBERS.map((member) => (
            <div
              key={member.name}
              className="flex-shrink-0 w-56 snap-start group"
            >
              <div className="bg-wenav-gray rounded-wenav overflow-hidden p-4 transition-all group-hover:ring-2 group-hover:ring-wenav-purple/30">
                <div className="relative w-full aspect-square mb-4 rounded-xl overflow-hidden bg-gray-200">
                  <Image
                    src={member.avatar}
                    alt={member.name}
                    fill
                    className="object-cover"
                    sizes="224px"
                  />
                </div>
                <h3 className="font-semibold text-wenav-dark text-sm">
                  {member.name}
                </h3>
                <p className="text-xs text-gray-500">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
