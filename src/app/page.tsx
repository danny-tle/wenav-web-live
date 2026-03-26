import LandingNavbar from "@/components/landing/LandingNavbar";
import HeroMap from "@/components/landing/HeroMap";
import DownloadSection from "@/components/landing/DownloadSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import TeamSection from "@/components/landing/TeamSection";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main>
      <LandingNavbar />
      <HeroMap />
      <div id="content">
        <DownloadSection />
      </div>
      <FeaturesSection />
      <TeamSection />
      <Footer />
    </main>
  );
}
