"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import { TEAM_MEMBERS } from "@/lib/constants";
import type { TeamMember } from "@/lib/types";
import { useLoopingCarousel } from "./useLoopingCarousel";

const ARROW =
  "p-2.5 rounded-full bg-black/10 text-wenav-dark hover:bg-black/15 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wenav-violet";

function Portrait({ member }: { member: TeamMember }) {
  return (
    <div className="relative shrink-0 w-full max-w-[324px] aspect-square rounded-[24px] overflow-hidden bg-[#e7e5ee]">
      {member.avatar ? (
        <Image
          src={member.avatar}
          alt={`Portrait of ${member.name}`}
          fill
          sizes="324px"
          className="object-cover"
        />
      ) : (
        // Placeholder until we have a photo.
        <div className="absolute inset-0 flex items-center justify-center text-[#b9b4c9]">
          <UserRound className="w-1/2 h-1/2" strokeWidth={1} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

function ContactLinks({ member }: { member: TeamMember }) {
  const link = "underline underline-offset-4 hover:text-wenav-violet transition-colors";
  const placeholder = "text-gray-400";

  return (
    <div className="flex flex-wrap gap-x-24 gap-y-3 text-[18px] text-wenav-dark">
      {member.email ? (
        <a href={`mailto:${member.email}`} className={link}>
          {member.email}
        </a>
      ) : (
        <span className={placeholder}>email coming soon</span>
      )}
      {member.linkedin ? (
        <a
          href={`https://${member.linkedin}`}
          target="_blank"
          rel="noopener noreferrer"
          className={link}
        >
          {member.linkedin}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : (
        <span className={placeholder}>LinkedIn coming soon</span>
      )}
    </div>
  );
}

export default function TeamSection() {
  const carousel = useLoopingCarousel(TEAM_MEMBERS.length, { interval: 5000 });
  const count = TEAM_MEMBERS.length;

  return (
    <section id="team" className="py-20 lg:py-28 bg-white">
      <div
        {...carousel.pauseProps}
        role="region"
        aria-roledescription="carousel"
        aria-label="The WeNav team"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="flex items-center justify-between gap-6 mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-[44px] font-medium text-wenav-dark tracking-tight">
            Meet the <span className="text-wenav-violet">Five</span> Behind WeNav
          </h2>
          <div className="flex shrink-0 gap-3">
            <button type="button" onClick={carousel.prev} className={ARROW} aria-label="Previous team member">
              <ChevronLeft size={22} strokeWidth={1.5} />
            </button>
            <button type="button" onClick={carousel.next} className={ARROW} aria-label="Next team member">
              <ChevronRight size={22} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="overflow-hidden">
          <div
            ref={carousel.trackRef}
            className="relative flex will-change-transform"
            style={carousel.trackStyle}
            aria-live="off"
          >
            {carousel.slots.map((slot) => {
              const i = carousel.itemAt(slot);
              const member = TEAM_MEMBERS[i];
              const clone = carousel.isClone(slot);
              const current = slot === carousel.currentSlot;
              // Only the visible slide can be reached by keyboard or screen reader.
              const offscreen = clone || !current;
              return (
                <div
                  key={slot}
                  role={clone ? undefined : "group"}
                  aria-roledescription={clone ? undefined : "slide"}
                  aria-label={clone ? undefined : `${i + 1} of ${count}: ${member.name}`}
                  aria-hidden={offscreen || undefined}
                  // React 18 has no `inert` prop, so set the DOM property directly.
                  ref={(el) => {
                    if (el) el.inert = offscreen;
                  }}
                  className="shrink-0 w-full flex flex-col md:flex-row gap-8 md:gap-10"
                >
                  <Portrait member={member} />
                  <div className="flex-1 min-w-0 pt-2">
                    <h3 className="text-[30px] font-medium text-wenav-dark mb-3">
                      {member.name}
                    </h3>
                    <p className="text-[18px] text-wenav-dark mb-8">{member.role}</p>
                    <p className="text-[14px] leading-[1.45] text-wenav-dark max-w-[960px] mb-12">
                      {member.bio}
                    </p>
                    <hr className="border-gray-400 max-w-[960px] mb-6" />
                    <ContactLinks member={member} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
