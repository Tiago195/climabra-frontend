/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Lock, ExternalLink, RefreshCw, CreditCard, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/authContext"
import { useRequireProfile } from "@/components/CompleteProfileDialog"
import { subscriptionService, type ISubscription } from "@/services/subscription"
import { onPaymentRequired } from "@/services/paywall"
import { SubscriptionPlanDialog } from "@/pages/settings/components/SubscriptionPlanDialog"
import { formatShortDate } from "@/pages/settings/components/format"

interface Ctx {
  sub: ISubscription | null
  /** Roda a ação só se o acesso estiver liberado; senão abre o paywall. */
  requireSubscription: (action: () => void) => void
  openPaywall: () => void
  refresh: () => Promise<void>
}
const SubscriptionGateContext = createContext<Ctx | null>(null)

export function SubscriptionGateProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const [sub, setSub] = useState<ISubscription | null>(null)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [plan, setPlan] = useState<{ open: boolean; step?: "select" | "card" }>({ open: false })
  const [refreshing, setRefreshing] = useState(false)
  const pendingAction = useRef<(() => void) | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    try {
      setSub(await subscriptionService.get(token))
    } catch {
      /* silencioso — não trava o app se a sync falhar */
    }
  }, [token])

  useEffect(() => { load() }, [load])

  // 402 vindo de qualquer ação sensível → abre o paywall.
  useEffect(() => {
    onPaymentRequired(() => { load(); setPaywallOpen(true) })
    return () => onPaymentRequired(null)
  }, [load])

  const refresh = useCallback(async () => {
    if (!token) return
    setRefreshing(true)
    try {
      const s = await subscriptionService.get(token)
      setSub(s)
      if (!s.blocked) finishPaywall()
    } finally {
      setRefreshing(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const finishPaywall = () => {
    setPaywallOpen(false)
    const action = pendingAction.current
    pendingAction.current = null
    if (action) setTimeout(action, 100)
  }

  const requireSubscription = useCallback((action: () => void) => {
    if (sub && sub.blocked) {
      pendingAction.current = action
      setPaywallOpen(true)
      return
    }
    action()
  }, [sub])

  const openPaywall = useCallback(() => setPaywallOpen(true), [])

  const onPlanDone = (s: ISubscription) => {
    setSub(s)
    setPlan({ open: false })
    if (!s.blocked) finishPaywall()
    else toast.message("Quase lá — conclua o pagamento para liberar o acesso.")
  }

  return (
    <SubscriptionGateContext.Provider value={{ sub, requireSubscription, openPaywall, refresh }}>
      {children}

      <PaywallDialog
        open={paywallOpen}
        sub={sub}
        refreshing={refreshing}
        onClose={() => setPaywallOpen(false)}
        onPlans={step => setPlan({ open: true, step })}
        onRefresh={refresh}
      />

      {sub && (
        <SubscriptionPlanDialog
          open={plan.open}
          plans={sub.plans}
          currentPlan={sub.plan}
          initialStep={plan.step}
          onClose={() => setPlan({ open: false })}
          onDone={onPlanDone}
        />
      )}
    </SubscriptionGateContext.Provider>
  )
}

function useGate(): Ctx {
  const ctx = useContext(SubscriptionGateContext)
  if (!ctx) throw new Error("use* must be used within SubscriptionGateProvider")
  return ctx
}
export const useSubscriptionGate = useGate
export function useRequireSubscription() {
  return useGate().requireSubscription
}

/** Gate combinado (perfil + assinatura): perfil primeiro, depois assinatura. */
export function useRequireAccess() {
  const requireProfile = useRequireProfile()
  const requireSubscription = useGate().requireSubscription
  return useCallback(
    (action: () => void) => requireProfile(() => requireSubscription(action)),
    [requireProfile, requireSubscription],
  )
}

// ── Banner persistente (no topo do conteúdo autenticado) ──────────────────────
export function SubscriptionBanner() {
  const { sub, openPaywall } = useGate()
  if (!sub || (!sub.blocked && !sub.inGrace)) return null

  if (sub.blocked) {
    const msg =
      sub.status === "past_due" || sub.status === "canceled"
        ? "Acesso suspenso — sua assinatura está vencida. Regularize para voltar a usar o Climabra."
        : sub.status === "trialing"
          ? "Seu período de teste terminou. Assine para continuar usando o Climabra."
          : "Assine o Climabra para liberar o acesso à ferramenta."
    return (
      <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-red-800 flex items-center gap-2">
          <Lock className="w-4 h-4 shrink-0" />
          {msg}
        </p>
        <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={openPaywall}>
          {sub.status === "past_due" || sub.status === "canceled" ? "Regularizar" : "Assinar"}
        </Button>
      </div>
    )
  }
  // inGrace
  return (
    <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-center justify-between gap-3 flex-wrap">
      <p className="text-sm text-amber-800">
        Sua fatura venceu. Regularize{sub.accessUntil ? ` até ${formatShortDate(sub.accessUntil)}` : ""} para
        não perder o acesso.
      </p>
      <Button size="sm" variant="outline" onClick={openPaywall}>Pagar</Button>
    </div>
  )
}

// ── Modal de pagamento ────────────────────────────────────────────────────────
function PaywallDialog({
  open, sub, refreshing, onClose, onPlans, onRefresh,
}: {
  open: boolean
  sub: ISubscription | null
  refreshing: boolean
  onClose: () => void
  onPlans: (step?: "select" | "card") => void
  onRefresh: () => void
}) {
  if (!sub) return null
  const isCard = sub.plan === "monthly_card"
  const reason =
    sub.status === "past_due" ? "Não recebemos o pagamento da sua última fatura."
    : sub.status === "canceled" ? "Sua assinatura foi cancelada e o período de acesso terminou."
    : "Seu período de uso terminou. Assine para continuar usando o Climabra."

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
              <Lock className="w-5 h-5 text-red-600" />
            </div>
            Pague para continuar
          </DialogTitle>
          <DialogDescription>{reason} Regularize para voltar a usar a ferramenta.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 pt-1">
          {sub.invoiceUrl && (
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => window.open(sub.invoiceUrl!, "_blank", "noopener")}
            >
              <ExternalLink className="w-4 h-4 mr-2" /> Pagar fatura
            </Button>
          )}

          {isCard && (
            <Button variant="outline" className="w-full" onClick={() => onPlans("card")}>
              <CreditCard className="w-4 h-4 mr-2" /> Atualizar cartão
            </Button>
          )}

          <Button variant="outline" className="w-full" onClick={() => onPlans("select")}>
            {sub.status === "canceled" ? "Reativar assinatura" : "Ver planos"}
          </Button>

          {sub.invoiceUrl && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="w-full text-xs text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1.5 pt-1"
            >
              {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Já paguei — atualizar
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
