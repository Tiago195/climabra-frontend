import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ShieldCheck, MessageCircle, ArrowRight, Sparkles } from "lucide-react"

const WHATSAPP = "https://wa.me/5511999990000"

const appointments = [
  { h: "09:00", c: "Maria Souza", s: "Manutenção · Sala", bar: "bg-blue-500" },
  { h: "11:30", c: "Carlos Pereira", s: "Instalação · Quarto", bar: "bg-emerald-500" },
  { h: "14:00", c: "Ana Lima", s: "Conserto · Geladeira", bar: "bg-amber-500" },
]

export function Hero() {
  return (
    <section className="px-5 py-16 md:py-24 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 text-xs font-medium px-3 py-1 rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Feito pra técnicos de manutenção e refrigeração
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight">
            Organize seus serviços de <span className="text-blue-600">manutenção</span> e refrigeração em um só lugar
          </h1>
          <p className="text-lg text-gray-600 mt-5">
            Agendamentos, clientes, financeiro e controle total — sem complicação.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <Link to="/auth/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto gap-2">
                Teste grátis agora <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                <MessageCircle className="w-4 h-4" /> Falar no WhatsApp
              </Button>
            </a>
          </div>
          <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Sem cartão de crédito · Dados protegidos
          </p>
        </div>

        <div className="relative flex justify-center">
          <div className="relative w-[280px] h-[560px] rounded-[2.5rem] bg-gray-900 p-3 shadow-2xl">
            <div className="w-full h-full rounded-[2rem] bg-white overflow-hidden flex flex-col">
              <div className="bg-gradient-to-br from-blue-600 to-emerald-500 text-white p-4 pt-8">
                <p className="text-xs opacity-80">Hoje</p>
                <p className="text-lg font-bold">Boa tarde, João!</p>
                <p className="text-xs opacity-90 mt-1">3 visitas agendadas</p>
              </div>
              <div className="p-3 space-y-2 flex-1 bg-gray-50">
                {appointments.map((v) => (
                  <div key={v.h} className="bg-white rounded-lg p-2.5 border shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-10 rounded-full ${v.bar}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900">{v.h} · {v.c}</p>
                        <p className="text-[10px] text-gray-500 truncate">{v.s}</p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                  </div>
                ))}
                <div className="bg-blue-600 text-white rounded-lg p-2.5 mt-3">
                  <p className="text-[10px] opacity-80">Faturamento da semana</p>
                  <p className="text-lg font-bold">R$ 2.840</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
