import { Navbar } from "./components/Navbar"
import { Hero } from "./components/Hero"
import { PainSection } from "./components/PainSection"
import { FeaturesSection } from "./components/FeaturesSection"
import { TestimonialsSection } from "./components/TestimonialsSection"
import { BenefitsSection } from "./components/BenefitsSection"
import { CtaBanner } from "./components/CtaBanner"
import { BeforeAfterSection } from "./components/BeforeAfterSection"
import { FaqSection } from "./components/FaqSection"
import { Footer } from "./components/Footer"
import { WhatsAppButton } from "./components/WhatsAppButton"

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <Hero />
      <PainSection />
      <FeaturesSection />
      <TestimonialsSection />
      <BenefitsSection />
      <CtaBanner variant="blue" />
      <BeforeAfterSection />
      <CtaBanner variant="urgency" />
      <FaqSection />
      <CtaBanner variant="dark" />
      <Footer />
      <WhatsAppButton />
    </div>
  )
}
