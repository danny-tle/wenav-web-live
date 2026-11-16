"use client";

import { useId, useState, type ReactNode } from "react";
import Image from "next/image";
import { ChevronDown, Monitor, Play, Smartphone } from "lucide-react";
import {
  CAREGIVER_TUTORIAL_STEPS,
  WALKER_TUTORIAL_STEPS,
} from "@/lib/constants";
import type { TutorialStep } from "@/lib/types";

const THEMES = {
  walker: {
    icon: "text-wenav-violet",
    card: "bg-[#f5f5f7]",
    badge: "bg-[#5B2BE0]",
  },
  caregiver: {
    icon: "text-[#2F5BEA]",
    card: "bg-[#eef3fe]",
    badge: "bg-[#2F5BEA]",
  },
} as const;

function StepGroup({
  icon,
  title,
  subtitle,
  steps,
  theme,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  steps: TutorialStep[];
  theme: keyof typeof THEMES;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const panelId = useId();
  const colors = THEMES[theme];

  return (
    <div>
      <h3>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          className="w-full flex items-center gap-3 mb-6 text-left rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-wenav-violet"
        >
          <span className={colors.icon} aria-hidden="true">
            {icon}
          </span>
          <span className="flex-1">
            <span className="text-[22px] font-semibold text-wenav-dark">
              {title}
            </span>
            <span className="text-[16px] text-gray-500"> · {subtitle}</span>
          </span>
          <ChevronDown
            size={30}
            strokeWidth={1.5}
            aria-hidden="true"
            className={`text-wenav-dark transition-transform duration-200 motion-reduce:transition-none ${open ? "" : "-rotate-90"}`}
          />
        </button>
      </h3>

      <div id={panelId} hidden={!open}>
        <ol className="space-y-4">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className={`flex gap-4 rounded-2xl px-6 py-5 ${colors.card}`}
            >
              <span
                className={`shrink-0 mt-0.5 flex items-center justify-center w-9 h-9 rounded-full text-white text-sm font-semibold ${colors.badge}`}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-[17px] text-wenav-dark">
                  <span className="sr-only">Step {i + 1}: </span>
                  {step.title}
                </p>
                <p className="text-[15px] leading-relaxed text-gray-600">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
        {children}
      </div>
    </div>
  );
}

export default function TutorialSection() {
  return (
    <section id="tutorial" className="bg-white py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-[32px] font-medium text-wenav-dark mb-8">
          Tutorial: How to use WeNav
        </h2>

        {/* Placeholder until the tutorial video is ready. */}
        <div
          role="img"
          aria-label="Tutorial video, coming soon"
          className="relative flex items-center justify-center w-full aspect-video md:aspect-[37/14] bg-[#272727] mb-16 lg:mb-20"
        >
          <span className="flex items-center justify-center w-20 h-20 lg:w-28 lg:h-28 rounded-full bg-[#d9d9d9]">
            <Play
              className="w-9 h-9 lg:w-12 lg:h-12 ml-1.5 fill-wenav-dark text-wenav-dark"
              aria-hidden="true"
            />
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 px-0 lg:px-8">
          <StepGroup
            icon={<Smartphone size={24} strokeWidth={1.75} />}
            title="For walkers"
            subtitle="Mobile app"
            steps={WALKER_TUTORIAL_STEPS}
            theme="walker"
          />
          <StepGroup
            icon={<Monitor size={24} strokeWidth={1.75} />}
            title="For caregivers"
            subtitle="Web dashboard"
            steps={CAREGIVER_TUTORIAL_STEPS}
            theme="caregiver"
          >
            {/* To update: replace public/assets/caregiver_dashboard.jpg
                (about 1200px wide; any aspect ratio works). */}
            <Image
              src="/assets/caregiver_dashboard.jpg"
              alt="The WeNav caregiver dashboard: a map showing the walker's location, with cards for their home address, status, last activity, emergency contact and history."
              width={1200}
              height={794}
              sizes="(min-width: 1024px) 560px, 100vw"
              className="mt-6 w-full h-auto rounded-2xl border border-gray-200"
            />
          </StepGroup>
        </div>
      </div>
    </section>
  );
}
