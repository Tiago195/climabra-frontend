import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  { q: "Preciso instalar algum programa?", a: "Não. Tudo funciona direto pelo navegador, no celular ou no computador. Você só precisa abrir o link e entrar." },
  { q: "Funciona no celular?", a: "Sim, o sistema é feito pensando em quem trabalha em campo. A maior parte dos prestadores usa direto pelo celular." },
  { q: "É difícil de usar?", a: "Não. Foi feito pra técnico, não pra programador. Em poucos minutos você já cadastra seus primeiros clientes e visitas." },
  { q: "Tem suporte?", a: "Sim. Atendimento direto pelo WhatsApp, sem robôs e sem fila de espera." },
  { q: "Meus dados ficam seguros?", a: "Sim. Tudo criptografado e armazenado em servidores seguros. Só você e seus clientes têm acesso." },
  { q: "Posso cancelar quando quiser?", a: "Sim, sem multa e sem burocracia. O teste grátis nem pede cartão." },
]

export function FaqSection() {
  return (
    <section className="px-5 py-16 md:py-24 bg-white">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Perguntas frequentes</h2>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-sm font-semibold">{item.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-gray-600">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
