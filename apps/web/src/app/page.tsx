import { Nav } from "@/components/home/Nav";
import { Hero } from "@/components/home/Hero";
import { TemplateCarousel } from "@/components/home/TemplateCarousel";
import { FeatureHighlights } from "@/components/home/FeatureHighlights";
import { HowItWorks } from "@/components/home/HowItWorks";
import { WhatsIncluded } from "@/components/home/WhatsIncluded";
import { TestimonialsCarousel } from "@/components/home/TestimonialsCarousel";

export default function HomePage() {
  return (
    <main>
      <Nav />
      <Hero />
      <TemplateCarousel />
      <FeatureHighlights />
      <HowItWorks />
      <WhatsIncluded />
      <TestimonialsCarousel />
    </main>
  );
}
