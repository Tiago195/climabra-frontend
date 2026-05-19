import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowRight, Clock, ShieldCheck } from "lucide-react"

interface CtaBannerProps {
  variant: "blue" | "dark" | "urgency"
}

export function CtaBanner({ variant }: CtaBannerProps) {
  if (variant === "blue") {
    return (
      <section className="px-5 py-16 md:py-24 bg-gradient-to-br from-blue-600 to-emerald-600 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Comece agora grátis</h2>
          <p className="mt-3 text-blue-100">Sem cartão de crédito. Em menos de 2 minutos você já está usando.</p>
          <Link to="/auth/register">
            <Button size="lg" className="mt-7 bg-white text-blue-700 hover:bg-blue-50 gap-2">
              Criar conta grátis <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    )
  }

  if (variant === "urgency") {
    return (
      <section className="px-5 py-16 md:py-24 bg-amber-50">
        <div className="max-w-3xl mx-auto text-center">
          <p className="inline-flex items-center gap-2 bg-amber-200 text-amber-900 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase">
            <Clock className="w-3.5 h-3.5" /> Por tempo limitado
          </p>
          <h2 className="text-2xl md:text-3xl font-bold">Teste grátis para os primeiros prestadores da sua região</h2>
          <p className="text-gray-600 mt-3">Vagas limitadas no plano gratuito. Garanta a sua antes que acabe.</p>
          <Link to="/auth/register">
            <Button size="lg" className="mt-6 bg-blue-600 hover:bg-blue-700 gap-2">
              Quero garantir minha vaga <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="px-5 py-16 md:py-24 bg-gradient-to-br from-gray-900 to-blue-900 text-white">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">
          Pare de perder clientes. Comece hoje.
        </h2>
        <p className="mt-4 text-blue-100">Junte-se a centenas de prestadores que já trabalham organizados.</p>
        <Link to="/auth/register">
          <Button size="lg" className="mt-8 bg-emerald-500 hover:bg-emerald-600 text-white gap-2">
            Criar conta grátis <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
        <p className="text-xs text-blue-200 mt-3 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> Sem cartão de crédito · Cancele quando quiser
        </p>
      </div>
    </section>
  )
}
