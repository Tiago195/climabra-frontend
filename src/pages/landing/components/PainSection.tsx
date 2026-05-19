import { XCircle } from "lucide-react"

const pains = [
  "Esquece de retornar pra clientes",
  "Perde horários e visitas",
  "Não sabe quanto realmente está ganhando",
  "Passa imagem desorganizada pro cliente",
]

export function PainSection() {
  return (
    <section className="px-5 py-16 md:py-24 bg-white">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl md:text-4xl font-bold">
          Você ainda anota serviços no papel ou no WhatsApp e acaba se perdendo?
        </h2>
        <p className="text-gray-600 mt-4">A bagunça custa caro. Todo mês ela tira clientes e dinheiro do seu bolso.</p>
        <div className="grid sm:grid-cols-2 gap-3 mt-10 text-left">
          {pains.map((p) => (
            <div key={p} className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
              <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span className="text-sm text-gray-800">{p}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
