import Image from "next/image";

// Sized in em so each icon tracks the headline's font size at every breakpoint.
const ICON = "shrink-0 h-[0.85em] w-auto";

export default function HighlightsBanner() {
  return (
    <section
      aria-label="Detect hazards, real-time alerts, safer navigation"
      className="bg-wenav-violet py-14 lg:py-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ul className="space-y-1 text-white font-semibold tracking-tight text-[34px] sm:text-5xl lg:text-[64px] leading-[1.3]">
          <li className="flex items-center gap-4 lg:gap-12">
            Detect Hazards.
            <Image src="/assets/icon_detect_eye.png" alt="" width={225} height={207} className={ICON} />
          </li>
          <li className="flex items-center gap-4 lg:gap-12 lg:pl-4">
            <Image src="/assets/icon_alert_bell.png" alt="" width={221} height={221} className={ICON} />
            Real-Time Alerts.
          </li>
          <li className="flex items-center gap-4 lg:gap-12">
            Safer Navigation.
            <Image src="/assets/icon_safe_shield.png" alt="" width={206} height={229} className={ICON} />
          </li>
        </ul>
      </div>
    </section>
  );
}
