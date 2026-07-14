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
import { Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/authContext"
import { isNativeApp } from "@/lib/native"

export default function Landing() {
  const { isAuthenticated } = useAuth()

  // No APP, "/" com sessão ativa é a home ERRADA: o provider já é usuário logado e reabrir o app
  // caindo na página de marketing ("Entrar"/"Teste grátis") não faz sentido. No NAVEGADOR a
  // Landing continua sendo a home do site, mesmo para quem está logado — por isso o isNativeApp.
  if (isNativeApp() && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

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
