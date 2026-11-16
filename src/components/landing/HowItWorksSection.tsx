import Image from "next/image";

const DIAGRAM_DESCRIPTION =
  "How WeNav fits together. The wearable sensor belt, worn at the waist, streams walk data to the walker's mobile app over Bluetooth. " +
  "The mobile app lets the walker start and stop a walk, report an incident, see live device battery and goal progress, create an account, and connect with a caregiver using a one-time code. " +
  "The app syncs with a Firebase backend that handles authentication and email verification, stores users, incidents, public incidents and high-risk areas, runs cloud functions for verification and pairing codes, and uses security rules to control who can read and write data. " +
  "The backend syncs with the web platform, built with Next.js and React, which offers a public interactive map of incidents and high-risk areas, plus a signed-in admin dashboard for managing users and incident reports and a caregiver dashboard for following a paired walker's activity.";

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-[#f7f6fb] pb-20 lg:pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-[32px] font-medium text-wenav-dark mb-8">
          How it works
        </h2>
        {/* Wide diagram: scrolls sideways on small screens instead of shrinking to unreadable. */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <Image
            src="/assets/how_it_works.png"
            alt={DIAGRAM_DESCRIPTION}
            width={3524}
            height={1684}
            sizes="(min-width: 1280px) 1216px, 100vw"
            className="w-full min-w-[720px] h-auto"
          />
        </div>
      </div>
    </section>
  );
}
