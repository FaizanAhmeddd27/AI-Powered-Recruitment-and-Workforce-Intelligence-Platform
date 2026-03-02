import PublicLayout from "@/components/layout/PublicLayout";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorks from "@/components/landing/HowItWorks";
import StatsCounter from "@/components/landing/StatsCounter";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTASection from "@/components/landing/CTASection";

export default function Landing() {
  return (
    <PublicLayout>
      <HeroSection />
      <StatsCounter />
      <FeaturesSection />
      <HowItWorks />
      <TestimonialsSection />
      <CTASection />
    </PublicLayout>
  );
}