import Image from "next/image";
import { FEATURES } from "@/lib/constants";
import Card from "@/components/shared/Card";

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-wenav-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-wenav-dark text-center mb-4">
          Features
        </h2>
        <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
          WeNav combines real-time obstacle detection with post-incident insight
          to keep you safe.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {FEATURES.map((feature) => (
            <Card key={feature.title}>
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-12 h-12 flex items-center justify-center mb-4">
                  <Image
                    src={feature.icon}
                    alt={feature.title}
                    width={32}
                    height={32}
                  />
                </div>
                <h3 className="font-semibold text-wenav-dark mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
