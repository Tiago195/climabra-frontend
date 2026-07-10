import axios from "axios"
import { DEFAULT_URL } from "."
import type { PaymentMethod } from "./enums"

/**
 * Serviço do Financeiro (CRM). Fonte: tabela local `payments` do provider — nunca
 * chama o gateway. Só `paid` conta como faturamento; `pending` é o "A receber".
 * Valores sempre em centavos (formatação em R$ fica no componente).
 */
const financeApi = axios.create({ baseURL: `${DEFAULT_URL}/providers/me` })

const authHeader = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded"

export interface IRevenue {
  currentMonthCents: number
  previousMonthCents: number
}

export interface IMonthlyRevenuePoint {
  month: string // yyyy-MM
  totalCents: number
}

export interface ITopClient {
  clientId: string
  clientName: string | null
  totalCents: number
  reportCount: number
  avgTicketCents: number
}

export interface IClientFinancials {
  clientId: string
  totalCents: number
  reportCount: number
  avgTicketCents: number
  lastPaymentAt: string | null
}

export interface IPaymentListItem {
  paymentId: string
  reportId: string
  reportDisplayCode: string | null
  clientId: string | null
  clientName: string | null
  amountCents: number
  method: PaymentMethod
  status: PaymentStatus
  detail: string | null
  paidAt: string | null
  createdAt: string
}

export interface IPaymentsPage {
  items: IPaymentListItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  totalCents: number
}

export interface IPaymentsQuery {
  clientId?: string
  status?: PaymentStatus
  method?: PaymentMethod
  start?: string // ISO date-time
  end?: string // ISO date-time
  page?: number
  size?: number
}

export const financeService = {
  /** Faturamento do mês corrente + anterior (KPI do dashboard). */
  async revenue(token: string): Promise<IRevenue> {
    const { data } = await financeApi.get<IRevenue>("/revenue", authHeader(token))
    return data
  },

  /** Série mensal de faturamento (default 6 meses), do mais antigo ao mais recente. */
  async monthly(token: string, months = 6): Promise<IMonthlyRevenuePoint[]> {
    const { data } = await financeApi.get<IMonthlyRevenuePoint[]>(
      "/revenue/monthly", { ...authHeader(token), params: { months } }
    )
    return data
  },

  /** Ranking de clientes por faturamento pago (default top 5). */
  async topClients(token: string, limit = 5): Promise<ITopClient[]> {
    const { data } = await financeApi.get<ITopClient[]>(
      "/revenue/top-clients", { ...authHeader(token), params: { limit } }
    )
    return data
  },

  /** Resumo financeiro de um cliente (bloco do ClientDetail). */
  async clientFinancials(token: string, clientId: string): Promise<IClientFinancials> {
    const { data } = await financeApi.get<IClientFinancials>(
      `/clients/${clientId}/financials`, authHeader(token)
    )
    return data
  },

  /** Lista paginada de pagamentos com filtros (período/status/método/cliente). */
  async payments(token: string, query: IPaymentsQuery = {}): Promise<IPaymentsPage> {
    const { data } = await financeApi.get<IPaymentsPage>(
      "/payments", { ...authHeader(token), params: query }
    )
    return data
  },
}
