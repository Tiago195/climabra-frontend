import { Calendar, Users, FileText, DollarSign, Smartphone, ShieldCheck, Wrench } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface Feature {
  icon: LucideIcon
  title: string
  desc: string
  bg: string
  fg: string
}

const features: Feature[] = [
  { icon: Calendar, title: "Agenda inteligente", desc: "Veja todas as visitas do dia, da semana e do mês. Cliente agenda sozinho pelo seu link.", bg: "bg-blue-100", fg: "text-blue-600" },
  { icon: Users, title: "Cadastro de clientes", desc: "Histórico completo, equipamentos e endereço sempre na mão.", bg: "bg-emerald-100", fg: "text-emerald-600" },
  { icon: FileText, title: "Ordem de serviço e laudo", desc: "Gere laudos com fotos antes/depois e mande pro cliente em segundos.", bg: "bg-amber-100", fg: "text-amber-600" },
  { icon: DollarSign, title: "Controle financeiro", desc: "Saiba exatamente quanto entrou, quanto saiu e quanto sobrou.", bg: "bg-emerald-100", fg: "text-emerald-600" },
  { icon: Smartphone, title: "Funciona no celular", desc: "Use no campo, no carro, em qualquer lugar. Não precisa instalar nada.", bg: "bg-blue-100", fg: "text-blue-600" },
  { icon: ShieldCheck, title: "Portal do cliente", desc: "Cliente acompanha visitas e laudos por um link exclusivo dele.", bg: "bg-amber-100", fg: "text-amber-600" },
]

export function FeaturesSection() {
  return (
    <section className="px-5 py-16 md:py-24 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-3xl mx-auto text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full mb-4">
          <Wrench className="w-3.5 h-3.5" /> A solução
        </div>
        <h2 className="text-2xl md:text-4xl font-bold">Tudo o que você precisa numa tela só</h2>
        <p className="text-gray-600 mt-4">
          Criado para quem presta serviços técnicos em equipamentos no dia a dia.
          Simples no celular, organizado no escritório.
        </p>
      </div>
      <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((f) => (
          <div key={f.title} className="border rounded-2xl p-6 hover:shadow-lg transition-shadow bg-white">
            <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
              <f.icon className={`w-5 h-5 ${f.fg}`} />
            </div>
            <h3 className="font-bold text-lg">{f.title}</h3>
            <p className="text-sm text-gray-600 mt-1.5">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
