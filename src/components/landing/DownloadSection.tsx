import Image from "next/image";
import Card from "@/components/shared/Card";
import { Monitor, Smartphone } from "lucide-react";

export default function DownloadSection() {
  return (
    <section id="download" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-wenav-dark text-center mb-4">
          Navigate safer. Stay connected.
        </h2>
        <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
          Download WeNav on your preferred platform and start navigating with
          confidence.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* PC/Mac */}
          <Card gray>
            <div className="text-center py-4">
              <Monitor size={36} className="mx-auto mb-4 text-wenav-dark" />
              <h3 className="font-semibold text-wenav-dark mb-2">PC/Mac</h3>
              <p className="text-sm text-gray-500 mb-4">
                View the web dashboard, monitor users, and manage reports.
              </p>
              <button className="px-5 py-2 bg-wenav-dark text-white text-sm font-semibold rounded-wenav hover:bg-wenav-dark/90 transition-colors">
                Login
              </button>
            </div>
          </Card>

          {/* iOS */}
          <Card gray>
            <div className="text-center py-4">
              <Smartphone size={36} className="mx-auto mb-4 text-wenav-dark" />
              <h3 className="font-semibold text-wenav-dark mb-2">iOS</h3>
              <p className="text-sm text-gray-500 mb-4">
                The WeNav iOS app enables smartphone-based obstacle detection.
              </p>
              <Image
                src="/assets/appstore_badge.png"
                alt="Download on the App Store"
                width={140}
                height={42}
                className="mx-auto"
              />
            </div>
          </Card>

          {/* Android */}
          <Card gray>
            <div className="text-center py-4">
              <Smartphone size={36} className="mx-auto mb-4 text-wenav-dark" />
              <h3 className="font-semibold text-wenav-dark mb-2">Android</h3>
              <p className="text-sm text-gray-500 mb-4">
                The WeNav Android app enables smartphone-based obstacle
                detection.
              </p>
              <Image
                src="/assets/googleplay_badge.png"
                alt="Get it on Google Play"
                width={160}
                height={48}
                className="mx-auto"
              />
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
