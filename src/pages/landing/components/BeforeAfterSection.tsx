import { XCircle, CheckCircle2 } from "lucide-react"

const before = ["Papel e bagunça", "Esquecimento de visitas", "Descontrole financeiro", "Imagem amadora"]
const after = ["Sistema organizado", "Agenda automática", "Tudo registrado", "Imagem profissional"]

export function BeforeAfterSection() {
  return (
    <section className="px-5 py-16 md:py-24 bg-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Antes e depois do ClimaGestão</h2>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="border-2 border-red-100 bg-red-50 rounded-2xl p-6">
            <p className="text-xs uppercase tracking-wide text-red-600 font-bold mb-4">Antes</p>
            <ul className="space-y-3">
              {before.map((i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" /> {i}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-2 border-emerald-200 bg-emerald-50 rounded-2xl p-6">
            <p className="text-xs uppercase tracking-wide text-emerald-700 font-bold mb-4">Depois</p>
            <ul className="space-y-3">
              {after.map((i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" /> {i}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
