import { Clock, Users, Sparkles, DollarSign } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface Benefit {
  icon: LucideIcon
  label: string
  bg: string
  fg: string
}

const benefits: Benefit[] = [
  { icon: Clock, label: "Mais organização", bg: "bg-blue-100", fg: "text-blue-600" },
  { icon: Users, label: "Mais clientes", bg: "bg-emerald-100", fg: "text-emerald-600" },
  { icon: Sparkles, label: "Mais profissionalismo", bg: "bg-amber-100", fg: "text-amber-600" },
  { icon: DollarSign, label: "Mais dinheiro", bg: "bg-emerald-100", fg: "text-emerald-600" },
]

export function BenefitsSection() {
  return (
    <section className="px-5 py-16 md:py-24 bg-white">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">O que muda no seu dia</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {benefits.map((b) => (
            <div key={b.label} className="text-center">
              <div className={`w-14 h-14 rounded-2xl ${b.bg} mx-auto flex items-center justify-center mb-3`}>
                <b.icon className={`w-6 h-6 ${b.fg}`} />
              </div>
              <p className="font-semibold text-sm">{b.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
