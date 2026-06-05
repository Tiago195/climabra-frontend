import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Check, ShieldCheck, CreditCard, FileText } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/authContext"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { AsaasDisclosure } from "@/components/AsaasDisclosure"
import { maskCardNumber, maskExpiry, maskCpf, onlyDigits, validateCard, parseCard } from "@/lib/card"
import {
  subscriptionService,
  type ISubscription,
  type ISubscriptionPlans,
  type SubscriptionPlan,
} from "@/services/subscription"
import { formatCents } from "./format"
import { PLAN_META, PLAN_ORDER, planPriceCents, yearlyDiscountPercent } from "./subscription-plans"

interface Props {
  open: boolean
  plans: ISubscriptionPlans
  currentPlan: SubscriptionPlan | null
  /** "card" pula direto p/ o cartão (ex.: "Atualizar cartão"). */
  initialStep?: "select" | "card"
  onClose: () => void
  onDone: (sub: ISubscription) => void
}

type Step = "select" | "card" | "confirm"

const maskCep = (v: string) => onlyDigits(v).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2")

/** Modal responsivo: Dialog no desktop, Sheet (bottom) no mobile. */
function ResponsiveModal({
  open, onOpenChange, title, children,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: React.ReactNode
  children: React.ReactNode
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    )
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl px-4 pt-3 pb-8 max-h-[92vh] overflow-y-auto text-sm">
        <SheetHeader className="px-0 text-left"><SheetTitle>{title}</SheetTitle></SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  )
}

export function SubscriptionPlanDialog({ open, plans, currentPlan, initialStep, onClose, onDone }: Props) {
  const { token } = useAuth()
  const [step, setStep] = useState<Step>("select")
  const [selected, setSelected] = useState<SubscriptionPlan>(currentPlan ?? "monthly_card")
  const [saving, setSaving] = useState(false)

  // card form
  const [number, setNumber] = useState("")
  const [holderName, setHolderName] = useState("")
  const [expiry, setExpiry] = useState("")
  const [ccv, setCcv] = useState("")
  const [cpf, setCpf] = useState("")
  const [cep, setCep] = useState("")
  const [addressNumber, setAddressNumber] = useState("")

  const resetCard = () => {
    setNumber(""); setHolderName(""); setExpiry(""); setCcv(""); setCpf(""); setCep(""); setAddressNumber("")
  }

  // (re)inicializa ao abrir
  useEffect(() => {
    if (!open) return
    if (initialStep === "card") { setSelected("monthly_card"); setStep("card") }
    else { setSelected(currentPlan ?? "monthly_card"); setStep("select") }
    resetCard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const close = () => {
    if (saving) return
    resetCard()
    onClose()
  }

  const discount = yearlyDiscountPercent(plans)

  const submit = async (card: boolean) => {
    if (!token) return
    let body: Parameters<typeof subscriptionService.subscribe>[1] = { plan: selected }
    if (card) {
      const error = validateCard({ number, holderName, expiry, ccv, cpf })
      if (error) { toast.error(error); return }
      if (onlyDigits(cep).length !== 8) { toast.error("Informe um CEP válido"); return }
      if (!addressNumber.trim()) { toast.error("Informe o número do endereço"); return }
      const p = parseCard({ number, holderName, expiry, ccv, cpf })
      body = {
        plan: "monthly_card",
        holderName: p.holderName, number: p.number, expiryMonth: p.expiryMonth,
        expiryYear: p.expiryYear, ccv: p.ccv, holderCpfCnpj: p.cpf,
        postalCode: onlyDigits(cep), addressNumber: addressNumber.trim(),
      }
    }
    setSaving(true)
    try {
      const sub = await subscriptionService.subscribe(token, body)
      toast.success(card ? "Cartão cadastrado!" : "Assinatura criada!")
      resetCard()
      onDone(sub)
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? "Não foi possível concluir. Tente novamente."
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const goNext = () => setStep(PLAN_META[selected].billing === "card" ? "card" : "confirm")

  const title =
    step === "card" ? <span className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-blue-600" /> Cartão para débito automático</span>
    : step === "confirm" ? <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" /> Confirmar assinatura</span>
    : currentPlan ? "Trocar de plano" : "Escolha seu plano"

  // ── Passo: escolher plano ──────────────────────────────────────────────────
  const selectBody = (
    <>
      <p className="text-sm text-gray-500 -mt-1">
        Você pode mudar ou cancelar quando quiser. Os valores já incluem tudo — sem taxa de adesão.
      </p>
      <div className="space-y-2 py-2">
        {PLAN_ORDER.map(plan => {
          const meta = PLAN_META[plan]
          const isCurrent = plan === currentPlan
          const isSel = plan === selected
          const price = planPriceCents(plan, plans)
          return (
            <button
              key={plan}
              type="button"
              onClick={() => setSelected(plan)}
              aria-pressed={isSel}
              className={`w-full text-left rounded-lg border p-3 transition ${
                isSel ? "border-blue-600 ring-1 ring-blue-600 bg-blue-50/40" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{meta.label}</span>
                  {isCurrent && <span className="text-[10px] font-medium text-gray-500">· atual</span>}
                  {meta.recommended && (
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 rounded-full px-2 py-0.5">Recomendado</span>
                  )}
                  {plan === "yearly" && discount > 0 && (
                    <span className="text-[10px] font-semibold text-green-700 bg-green-100 rounded-full px-2 py-0.5">Economize {discount}%</span>
                  )}
                </div>
                <div className={`w-4 h-4 rounded-full border shrink-0 grid place-items-center ${isSel ? "border-blue-600 bg-blue-600" : "border-gray-300"}`}>
                  {isSel && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="text-lg font-bold text-gray-900">{formatCents(price)}</span>
                <span className="text-xs text-gray-500">{meta.cycleSuffix}</span>
                {plan === "yearly" && <span className="text-xs text-gray-400 ml-1">≈ {formatCents(price / 12)}/mês</span>}
              </div>
              <p className="mt-0.5 text-xs text-gray-500">{meta.description}</p>
            </button>
          )
        })}
      </div>
      <p className="text-[11px] text-gray-400">
        <strong>Débito automático</strong> cobra sozinho no cartão. <strong>Por fatura</strong> envia um link
        para você pagar — sem cadastrar cartão.
      </p>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
        <Button variant="outline" onClick={close}>Cancelar</Button>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={goNext} disabled={selected === currentPlan}>
          {selected === currentPlan ? "Plano atual" : "Continuar"}
        </Button>
      </div>
    </>
  )

  // ── Passo: cartão (auto-débito) ────────────────────────────────────────────
  const cardBody = (
    <form onSubmit={e => { e.preventDefault(); submit(true) }} className="space-y-3 pt-1">
      <p className="text-xs text-gray-500">
        Cobramos {formatCents(plans.monthlyCardCents)}/mês neste cartão. Cancele quando quiser.
      </p>
      <div className="space-y-1">
        <Label className="text-xs">Número do cartão</Label>
        <div className="relative">
          <Input inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000"
            value={number} onChange={e => setNumber(maskCardNumber(e.target.value))} className="pr-10" />
          <CreditCard className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Nome do titular</Label>
        <Input autoComplete="cc-name" placeholder="Como está no cartão"
          value={holderName} onChange={e => setHolderName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Validade</Label>
          <Input inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA"
            value={expiry} onChange={e => setExpiry(maskExpiry(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">CVV</Label>
          <Input inputMode="numeric" autoComplete="cc-csc" placeholder="000"
            value={ccv} onChange={e => setCcv(onlyDigits(e.target.value).slice(0, 4))} />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">CPF do titular</Label>
        <Input inputMode="numeric" placeholder="000.000.000-00"
          value={cpf} onChange={e => setCpf(maskCpf(e.target.value))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">CEP do titular</Label>
          <Input inputMode="numeric" autoComplete="postal-code" placeholder="00000-000"
            value={cep} onChange={e => setCep(maskCep(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Número</Label>
          <Input placeholder="Nº" value={addressNumber} onChange={e => setAddressNumber(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
        {initialStep !== "card" && (
          <Button type="button" variant="outline" onClick={() => setStep("select")} disabled={saving}>Voltar</Button>
        )}
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Confirmar cartão
        </Button>
      </div>
      <div className="space-y-1.5 pt-1">
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> Seus dados são enviados com segurança.
        </p>
        <AsaasDisclosure />
      </div>
    </form>
  )

  // ── Passo: confirmar (fatura) ──────────────────────────────────────────────
  const meta = PLAN_META[selected]
  const price = planPriceCents(selected, plans)
  const confirmBody = (
    <div className="space-y-3 pt-1">
      <p className="text-xs text-gray-500">
        Sem cartão: geramos um link de pagamento e seu acesso é liberado assim que a fatura for paga.
      </p>
      <div className="rounded-lg border border-gray-200 p-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900">{meta.label}</p>
          <p className="text-xs text-gray-500">Pagamento por fatura (link)</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">{formatCents(price)}</p>
          <p className="text-xs text-gray-500">{meta.cycleSuffix}</p>
        </div>
      </div>
      <p className="text-xs text-gray-500">
        {selected === "yearly"
          ? `Fatura anual de ${formatCents(price)}. Pague por PIX ou boleto no link — renova daqui a 12 meses.`
          : `Fatura mensal de ${formatCents(price)}. Pague por PIX ou boleto no link — renova todo mês.`}{" "}
        Depois de confirmar, o botão <strong>Pagar fatura</strong> aparece aqui no painel.
      </p>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
        <Button variant="outline" onClick={() => setStep("select")} disabled={saving}>Voltar</Button>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => submit(false)} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Gerar fatura
        </Button>
      </div>
    </div>
  )

  return (
    <ResponsiveModal open={open} onOpenChange={o => !o && close()} title={title}>
      {step === "select" && selectBody}
      {step === "card" && cardBody}
      {step === "confirm" && confirmBody}
    </ResponsiveModal>
  )
}
