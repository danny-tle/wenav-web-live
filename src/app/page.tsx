import LandingNavbar from "@/components/landing/LandingNavbar";
import HeroMap from "@/components/landing/HeroMap";
import IntroSection from "@/components/landing/IntroSection";
import AboutSection from "@/components/landing/AboutSection";
import HighlightsBanner from "@/components/landing/HighlightsBanner";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import TutorialSection from "@/components/landing/TutorialSection";
import TeamSection from "@/components/landing/TeamSection";
import DownloadSection from "@/components/landing/DownloadSection";
import Footer from "@/components/landing/Footer";
import { HomeTourProvider } from "@/components/landing/HomeTour";

export default function LandingPage() {
  return (
    <HomeTourProvider>
    <main>
      <LandingNavbar />
      <HeroMap />
      <IntroSection />
      <AboutSection />
      <HighlightsBanner />
      <FeaturesSection />
      <HowItWorksSection />
      <TutorialSection />
      <TeamSection />
      <DownloadSection />
      <Footer />
    </main>
    </HomeTourProvider>
  );
}
