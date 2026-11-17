import Image from "next/image";

export default function AboutSection() {
  return (
    <section id="about" className="bg-white py-16 lg:py-[100px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-center gap-12 lg:gap-14">
        <div className="flex gap-4 sm:gap-5 shrink-0 mx-auto lg:mx-0" aria-hidden="true">
          <div className="relative w-[130px] h-[285px] sm:w-[178px] sm:h-[390px] rounded-full overflow-hidden">
            <Image
              src="/assets/about_caregiver_face.jpg"
              alt=""
              fill
              sizes="178px"
              className="object-cover"
            />
          </div>
          <div className="relative w-[130px] h-[285px] sm:w-[178px] sm:h-[390px] mt-[125px] sm:mt-[172px] rounded-full overflow-hidden">
            <Image
              src="/assets/about_caregiver_devices.jpg"
              alt=""
              fill
              sizes="178px"
              className="object-cover"
            />
          </div>
        </div>

        <div className="max-w-[580px]">
          <p className="text-wenav-violet text-lg mb-2">About</p>
          <h2 className="text-4xl sm:text-[44px] font-bold text-wenav-dark leading-[1.4] tracking-tight mb-8">
            Connecting Care.
            <br />
            Supporting Independence.
          </h2>
          <div className="space-y-6 text-[16px] leading-[1.5] text-wenav-dark">
            <p>
              WeNav brings together wearable technology, a mobile app, and a
              caregiver dashboard to support people with visual impairments.
              Created to address the challenges of navigating unfamiliar
              environments and staying connected with caregivers, WeNav
              combines obstacle awareness, device status, and incident
              information in one connected system.
            </p>
            <p>
              Our goal is to help users navigate with greater confidence and
              independence while giving caregivers a clearer way to stay
              informed and offer support.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
