import type { ISubscriptionPlans, SubscriptionPlan } from "@/services/subscription"

export interface PlanMeta {
  label: string
  billing: "card" | "invoice"
  method: string // "Débito automático" | "Por fatura"
  description: string
  cycleSuffix: string // "/mês" | "/ano"
  recommended?: boolean
}

export const PLAN_META: Record<SubscriptionPlan, PlanMeta> = {
  monthly_card: {
    label: "Mensal · Cartão",
    billing: "card",
    method: "Débito automático",
    description: "Cobrança automática no cartão todo mês. Cancele quando quiser.",
    cycleSuffix: "/mês",
    recommended: true,
  },
  monthly_invoice: {
    label: "Mensal · Fatura",
    billing: "invoice",
    method: "Por fatura",
    description: "Um link de pagamento chega para você todo mês.",
    cycleSuffix: "/mês",
  },
  yearly: {
    label: "Anual · Fatura",
    billing: "invoice",
    method: "Por fatura",
    description: "Pago uma vez por ano via link — o plano mais econômico.",
    cycleSuffix: "/ano",
  },
}

export const PLAN_ORDER: SubscriptionPlan[] = ["monthly_card", "monthly_invoice", "yearly"]

export function planPriceCents(plan: SubscriptionPlan, plans: ISubscriptionPlans): number {
  switch (plan) {
    case "monthly_card":
      return plans.monthlyCardCents
    case "monthly_invoice":
      return plans.monthlyInvoiceCents
    case "yearly":
      return plans.yearlyCents
  }
}

/** Economia do anual vs. 12× o plano mensal-cartão (ex.: 17%). 0 se não fizer sentido. */
export function yearlyDiscountPercent(plans: ISubscriptionPlans): number {
  const full = plans.monthlyCardCents * 12
  if (!full || plans.yearlyCents >= full) return 0
  return Math.round((1 - plans.yearlyCents / full) * 100)
}
