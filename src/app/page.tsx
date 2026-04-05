import LandingNavbar from "@/components/landing/LandingNavbar";
import HeroMap from "@/components/landing/HeroMap";
import DownloadSection from "@/components/landing/DownloadSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import InfoSection from "@/components/landing/InfoSection";
import TeamSection from "@/components/landing/TeamSection";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main>
      <LandingNavbar />
      <HeroMap />
      <InfoSection />
      <FeaturesSection />
      <TeamSection />
      <div id="content">
        <DownloadSection />
      </div>
      <Footer />
    </main>
  );
}
