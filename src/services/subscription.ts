import axios from "axios"
import { DEFAULT_URL } from "."

const subscriptionApi = axios.create({ baseURL: `${DEFAULT_URL}/providers` })
const authHeader = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

export type SubscriptionStatus = "none" | "trialing" | "active" | "past_due" | "canceled"
export type SubscriptionPlan = "monthly_card" | "monthly_invoice" | "yearly"

export interface ISubscriptionPlans {
  monthlyCardCents: number
  monthlyInvoiceCents: number
  yearlyCents: number
}

export interface ISubscription {
  status: SubscriptionStatus
  plan: SubscriptionPlan | null
  cardLast4: string | null
  trialEndsAt: string | null // ISO datetime
  nextDueDate: string | null // ISO date (yyyy-MM-dd)
  invoiceUrl: string | null
  plans: ISubscriptionPlans
  // acesso à ferramenta (Fase B — paywall)
  blocked: boolean
  inGrace: boolean
  accessUntil: string | null // ISO date
}

/** Dados do cartão para auto-débito (só em monthly_card). PAN/CVV não são persistidos. */
export interface ISubscribeCard {
  holderName: string
  number: string
  expiryMonth: string
  expiryYear: string
  ccv: string
  holderCpfCnpj: string
  // dados do titular exigidos pela Asaas (email/telefone caem p/ os do provider no backend se vazios)
  postalCode: string
  addressNumber: string
  holderEmail?: string
  phone?: string
}

export interface ISubscribeRequest extends Partial<ISubscribeCard> {
  plan: SubscriptionPlan
}

export const subscriptionService = {
  async get(token: string): Promise<ISubscription> {
    const { data } = await subscriptionApi.get<ISubscription>("/me/subscription", authHeader(token))
    return data
  },

  async subscribe(token: string, body: ISubscribeRequest): Promise<ISubscription> {
    const { data } = await subscriptionApi.post<ISubscription>("/me/subscription", body, authHeader(token))
    return data
  },

  async cancel(token: string): Promise<ISubscription> {
    const { data } = await subscriptionApi.delete<ISubscription>("/me/subscription", authHeader(token))
    return data
  },
}
