import { createApi } from "."
import type { PaymentMethod } from "./enums"

/**
 * Serviço do Financeiro (CRM). Fonte: tabela local `payments` do provider — nunca
 * chama o gateway. Só `paid` conta como faturamento; `pending` é o "A receber".
 * Valores sempre em centavos (formatação em R$ fica no componente).
 */
const financeApi = createApi("/providers/me")

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

/** Detalhe de um pagamento (CRM F6.2). `net*` vêm da Asaas best-effort — `null` quando indisponível. */
export interface IPaymentDetail {
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
  netAmountCents: number | null
  feeCents: number | null
  netAvailable: boolean
}

/** Funil de conversão de um período (CRM F6.1): solicitações → agendado → concluído → pago. */
export interface IConversion {
  submissionsCount: number
  scheduledCount: number
  completedCount: number
  paidCount: number
  paidAmountCents: number
  submissionsToScheduledRate: number | null
  scheduledToCompletedRate: number | null
  completedToPaidRate: number | null
  avgCycleDays: number | null
}

export interface IConversionQuery {
  start?: string
  end?: string
}

/** Uma linha do extrato da conta de recebimento (Saque · F5). */
export interface IStatementEntry {
  date: string
  type: "payment" | "payout" | "fee" | "refund" | "other"
  description: string | null
  /** Positivo = entrou; negativo = saiu. */
  amountCents: number
  /** Saldo após o lançamento. */
  balanceCents: number
}

/** Saldo da conta de recebimento (Saque · F1). */
export interface IBalance {
  /** Provider ainda não conectou pagamentos — não é erro, só não há conta. */
  hasGatewayAccount: boolean
  /** Conta 100% aprovada? Sem isso o saldo existe mas não pode ser sacado. */
  payoutEnabled: boolean
  /** Liberado: dá para sacar agora. */
  availableCents: number
  /** Pago pelo cliente, ainda não liberado (cartão libera em D+30). */
  pendingCents: number
}

export const financeService = {
  /** Faturamento do mês corrente + anterior (KPI do dashboard). */
  async revenue(token: string): Promise<IRevenue> {
    const { data } = await financeApi.get<IRevenue>("/revenue", authHeader(token))
    return data
  },

  /**
   * Saldo da conta de recebimento (Saque · F1). Diferente de `revenue`, que soma a tabela local:
   * aqui é o dinheiro que existe de fato na conta, e só `availableCents` pode virar saque hoje.
   * Erro NÃO vira zero — a tela mostra retry (o card nunca inventa "R$ 0,00").
   */
  async balance(token: string): Promise<IBalance> {
    const { data } = await financeApi.get<IBalance>("/balance", authHeader(token))
    return data
  },

  /** Série mensal de faturamento (default 6 meses), do mais antigo ao mais recente. */
  async monthly(token: string, months = 6): Promise<IMonthlyRevenuePoint[]> {
    const { data } = await financeApi.get<IMonthlyRevenuePoint[]>(
      "/revenue/monthly", { ...authHeader(token), params: { months } }
    )
    return data
  },

  /**
   * Extrato da conta de recebimento (Saque · F5): entradas, taxas e saques na linha do tempo.
   * É o que explica a diferença entre "Recebido" (local) e "Saldo" (conta real).
   */
  async statement(token: string, start: string, end: string): Promise<IStatementEntry[]> {
    const { data } = await financeApi.get<IStatementEntry[]>(
      "/statement", { ...authHeader(token), params: { start, end } }
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

  /** Detalhe de um pagamento — bruto local + líquido/taxa da Asaas (best-effort). */
  async paymentDetail(token: string, paymentId: string): Promise<IPaymentDetail> {
    const { data } = await financeApi.get<IPaymentDetail>(
      `/payments/${paymentId}`, authHeader(token)
    )
    return data
  },

  /** Funil de conversão do período (default mês corrente quando sem start/end). */
  async conversion(token: string, query: IConversionQuery = {}): Promise<IConversion> {
    const { data } = await financeApi.get<IConversion>(
      "/conversion", { ...authHeader(token), params: query }
    )
    return data
  },

  /**
   * Export CSV da lista filtrada (endpoint dedicado, sem paginação — a lista da
   * tela é paginada; exportar só a página visível seria enganoso). Devolve o
   * blob pronto para download.
   */
  async exportPaymentsCsv(token: string, query: Omit<IPaymentsQuery, "page" | "size"> = {}): Promise<Blob> {
    const { data } = await financeApi.get(
      "/payments/export", { ...authHeader(token), params: query, responseType: "blob" }
    )
    return data
  },
}
