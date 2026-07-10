import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sparkles, Clock, Gift, CheckCircle2, AlertTriangle, XCircle,
  CreditCard, FileText, ExternalLink, Check,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/authContext"
import { subscriptionService, type ISubscription, type SubscriptionPlan } from "@/services/subscription"
import { formatCents, formatShortDate, daysUntil } from "./format"
import { PLAN_META, planPriceCents } from "./subscription-plans"
import { SubscriptionPlanDialog } from "./SubscriptionPlanDialog"
import { CancelSubscriptionDialog } from "./CancelSubscriptionDialog"
import { getApiErrorMessage } from "@/services/apiError"

type PillTone = "amber" | "purple" | "green" | "red" | "gray" | "blue"
const PILL: Record<PillTone, string> = {
  amber: "bg-amber-100 text-amber-700",
  purple: "bg-purple-100 text-purple-700",
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
  gray: "bg-gray-100 text-gray-600",
  blue: "bg-blue-100 text-blue-700",
}

function Pill({ tone, children }: { tone: PillTone; children: React.ReactNode }) {
  return <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${PILL[tone]}`}>{children}</span>
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  )
}

export function SubscriptionSection() {
  const { token } = useAuth()
  const [sub, setSub] = useState<ISubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [planDialog, setPlanDialog] = useState<{ open: boolean; step?: "select" | "card" }>({ open: false })
  const [cancelOpen, setCancelOpen] = useState(false)

  useEffect(() => {
    if (!token) return
    subscriptionService.get(token)
      .then(setSub)
      .catch(e => toast.error(getApiErrorMessage(e, "Não foi possível carregar sua assinatura")))
      .finally(() => setLoading(false))
  }, [token])

  const openPlans = (step?: "select" | "card") => setPlanDialog({ open: true, step })
  const onDone = (s: ISubscription) => { setSub(s); setPlanDialog({ open: false }) }
  const payInvoice = () => sub?.invoiceUrl && window.open(sub.invoiceUrl, "_blank", "noopener")

  const cancel = async () => {
    if (!token) return
    try {
      const s = await subscriptionService.cancel(token)
      setSub(s)
      setCancelOpen(false)
      toast.success("Assinatura cancelada.")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Não foi possível cancelar"))
    }
  }

  const header = (
    <div>
      <h2 className="text-lg font-bold text-gray-900">Assinatura</h2>
      <p className="text-sm text-gray-500">
        Sua mensalidade do Climabra — o que mantém o app e as ferramentas no ar.
      </p>
    </div>
  )

  if (loading || !sub) {
    return (
      <div className="space-y-4">
        {header}
        <Card><CardContent className="py-6 space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-10 w-48" />
        </CardContent></Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {header}
      <Card><CardContent className="py-6">{renderState()}</CardContent></Card>

      <SubscriptionPlanDialog
        open={planDialog.open}
        plans={sub.plans}
        currentPlan={sub.plan}
        initialStep={planDialog.step}
        onClose={() => setPlanDialog({ open: false })}
        onDone={onDone}
      />
      <CancelSubscriptionDialog
        open={cancelOpen}
        nextDueDate={sub.nextDueDate}
        onClose={() => setCancelOpen(false)}
        onConfirm={cancel}
      />
    </div>
  )

  function renderState() {
    const s = sub!
    if (s.status === "none") return noneCard()
    if (s.status === "trialing") {
      if (!s.trialEndsAt) return cortesiaCard()
      return s.plan ? trialWithPlanCard() : trialAddPaymentCard()
    }
    if (s.status === "active") return activeCard()
    if (s.status === "past_due") return pastDueCard()
    return canceledCard()
  }

  // ── none ───────────────────────────────────────────────────────────────────
  function noneCard() {
    const min = sub!.plans.monthlyCardCents
    const bullets = ["Laudos e clientes ilimitados", "Cobrança e agenda integradas", "Cancele quando quiser"]
    return (
      <div className="text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-blue-100 grid place-items-center mx-auto mb-3">
          <Sparkles className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Assine o Climabra</h3>
        <p className="text-sm text-gray-500 mt-1">
          Escolha um plano para liberar laudos, agenda e cobrança pelos seus serviços — sem limite de uso.
        </p>
        <ul className="text-left inline-flex flex-col gap-1.5 my-4">
          {bullets.map(b => (
            <li key={b} className="flex items-center gap-2 text-sm text-gray-700">
              <Check className="w-4 h-4 text-green-600" /> {b}
            </li>
          ))}
        </ul>
        <div>
          <Button className="bg-blue-600 hover:bg-blue-700 h-11 px-8" onClick={() => openPlans()}>Assinar</Button>
          <p className="text-xs text-gray-400 mt-2">A partir de {formatCents(min)}/mês</p>
        </div>
      </div>
    )
  }

  // ── trial: sem forma de pagamento ──────────────────────────────────────────
  function trialAddPaymentCard() {
    const s = sub!
    const days = daysUntil(s.trialEndsAt)
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">Você está no período de teste</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Aproveite o Climabra completo. Adicione uma forma de pagamento para continuar sem interrupção
              quando o teste acabar.
            </p>
          </div>
          <Pill tone="amber">Em teste</Pill>
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>Faltam {days} {days === 1 ? "dia" : "dias"}</strong> de teste · termina {formatShortDate(s.trialEndsAt)}
          </p>
        </div>
        <p className="text-xs text-gray-500">
          Sem cobrança agora. Se você cadastrar um cartão, a 1ª cobrança só acontece em {formatShortDate(s.trialEndsAt)}.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => openPlans("card")}>
            Adicionar forma de pagamento
          </Button>
          <Button variant="outline" onClick={() => openPlans()}>Ver planos</Button>
        </div>
      </div>
    )
  }

  // ── trial: já escolheu plano/forma de pagamento ────────────────────────────
  function trialWithPlanCard() {
    const s = sub!
    const days = daysUntil(s.trialEndsAt)
    const meta = PLAN_META[s.plan as SubscriptionPlan]
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">Tudo pronto — você está no teste</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Sua forma de pagamento já está cadastrada. A 1ª cobrança só acontece quando o teste terminar.
            </p>
          </div>
          <Pill tone="amber">Em teste</Pill>
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>Faltam {days} {days === 1 ? "dia" : "dias"}</strong> · 1ª cobrança em {formatShortDate(s.trialEndsAt)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 px-3">
          <DataRow label="Plano" value={meta.label} />
          <DataRow label="Valor" value={<>{formatCents(planPriceCents(s.plan as SubscriptionPlan, s.plans))}<span className="text-gray-400 font-normal">{meta.cycleSuffix}</span></>} />
          <DataRow label="Forma de pagamento" value={paymentMethodLabel()} />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => openPlans()}>Trocar de plano</Button>
          <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setCancelOpen(true)}>
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  // ── cortesia (isenção) ─────────────────────────────────────────────────────
  function cortesiaCard() {
    return (
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">Acesso por cortesia</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Sua conta está liberada por cortesia da Climabra — sem mensalidade e sem prazo.
            </p>
          </div>
          <Pill tone="purple">Cortesia</Pill>
        </div>
        <div className="rounded-lg bg-purple-50 border border-purple-100 p-3 flex items-center gap-2">
          <Gift className="w-4 h-4 text-purple-600 shrink-0" />
          <p className="text-sm text-purple-800">
            Aproveite o app à vontade. Se um dia isso mudar, avisamos por aqui com antecedência —
            nenhuma cobrança será feita sem o seu aval.
          </p>
        </div>
      </div>
    )
  }

  // ── active ─────────────────────────────────────────────────────────────────
  function activeCard() {
    const s = sub!
    const plan = s.plan as SubscriptionPlan
    const meta = PLAN_META[plan]
    const isInvoice = meta.billing === "invoice"
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">Assinatura ativa</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Tudo certo! Seu acesso ao Climabra está em dia. Você pode trocar de plano ou cancelar a qualquer momento.
            </p>
          </div>
          <Pill tone="green"><span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Ativa</span></Pill>
        </div>
        <div className="rounded-lg border border-gray-200 px-3">
          <DataRow label="Plano" value={meta.label} />
          <DataRow label="Valor" value={<>{formatCents(planPriceCents(plan, s.plans))}<span className="text-gray-400 font-normal">{meta.cycleSuffix}</span></>} />
          {s.nextDueDate && <DataRow label="Próximo vencimento" value={formatShortDate(s.nextDueDate)} />}
          <DataRow label="Forma de pagamento" value={paymentMethodLabel()} />
        </div>

        {isInvoice && s.invoiceUrl && (
          <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
            <p className="text-sm font-medium text-blue-900">
              Fatura de {formatCents(planPriceCents(plan, s.plans))} disponível
            </p>
            <p className="text-xs text-blue-700 mt-0.5">Pague por PIX ou boleto pelo link para confirmar o período.</p>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 mt-2" onClick={payInvoice}>
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Pagar fatura
            </Button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => openPlans()}>Trocar de plano</Button>
          <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setCancelOpen(true)}>
            Cancelar assinatura
          </Button>
        </div>
      </div>
    )
  }

  // ── past_due ───────────────────────────────────────────────────────────────
  function pastDueCard() {
    const s = sub!
    const plan = s.plan as SubscriptionPlan | null
    const meta = plan ? PLAN_META[plan] : null
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">Fatura em aberto</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Não recebemos o pagamento da sua última fatura. Regularize para manter o acesso ao Climabra sem interrupção.
            </p>
          </div>
          <Pill tone="red"><span className="inline-flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />Pagamento pendente</span></Pill>
        </div>
        <div className="rounded-lg bg-red-50 border border-red-100 p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <p className="text-sm text-red-800">
            {plan && <>Fatura de {formatCents(planPriceCents(plan, s.plans))} ({meta!.label})</>}
            {s.nextDueDate ? ` venceu em ${formatShortDate(s.nextDueDate)}.` : " em aberto."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {s.invoiceUrl && (
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={payInvoice}>
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Pagar fatura
            </Button>
          )}
          {plan === "monthly_card" && (
            <Button variant="outline" onClick={() => openPlans("card")}>Atualizar cartão</Button>
          )}
          {plan !== "monthly_card" && (
            <Button variant="outline" onClick={() => openPlans()}>Trocar de plano</Button>
          )}
        </div>
      </div>
    )
  }

  // ── canceled ───────────────────────────────────────────────────────────────
  function canceledCard() {
    const s = sub!
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">Assinatura cancelada</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Tudo certo, sua assinatura foi cancelada. Você continua com acesso ao app até o fim do período já pago.
            </p>
          </div>
          <Pill tone="gray"><span className="inline-flex items-center gap-1"><XCircle className="w-3.5 h-3.5" />Cancelada</span></Pill>
        </div>
        {s.nextDueDate && (
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
            <p className="text-sm text-gray-700">Acesso disponível até {formatShortDate(s.nextDueDate)}.</p>
          </div>
        )}
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => openPlans()}>Reativar assinatura</Button>
      </div>
    )
  }

  function paymentMethodLabel() {
    const s = sub!
    if (s.plan === "monthly_card") {
      return (
        <span className="inline-flex items-center gap-1.5">
          <CreditCard className="w-4 h-4 text-gray-400" /> Cartão {s.cardLast4 ? `•••• ${s.cardLast4}` : ""}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5">
        <FileText className="w-4 h-4 text-gray-400" /> Fatura por link
      </span>
    )
  }
}
