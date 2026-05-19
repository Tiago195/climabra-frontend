const testimonials = [
  { name: "João Silva", role: "Técnico em SP", quote: "Depois que comecei a usar, nunca mais perdi cliente. A agenda sozinha já vale." },
  { name: "Roberto Andrade", role: "Refrigeração comercial", quote: "Agora sei exatamente quanto estou ganhando. Antes era no chute." },
  { name: "Marcos Lima", role: "Equipe de 3 técnicos", quote: "Meus clientes acham que tenho uma empresa grande. Passa muita credibilidade." },
]

export function TestimonialsSection() {
  return (
    <section className="px-5 py-16 md:py-24 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Quem usa, recomenda</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((d) => (
            <div key={d.name} className="bg-white rounded-2xl p-6 border shadow-sm">
              <p className="text-gray-700 text-sm leading-relaxed">"{d.quote}"</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white font-bold">
                  {d.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold">{d.name}</p>
                  <p className="text-xs text-gray-500">{d.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
