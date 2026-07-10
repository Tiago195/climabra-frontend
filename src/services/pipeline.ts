import axios from "axios"
import { DEFAULT_URL } from "."
import type { DeclinedReason } from "./enums"

/**
 * Funil comercial do provider (CRM F2). Visão agregada por estágio (contagem +
 * Σ valor em centavos + cards) construída sobre os estados do laudo e as
 * solicitações em aberto. Somente leitura. Formatação em R$ fica no componente.
 */
const pipelineApi = axios.create({ baseURL: `${DEFAULT_URL}/providers/me` })

const authHeader = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

/** Chaves de estágio devolvidas pelo backend, na ordem do funil. */
export type PipelineStageKey =
  | "open_submissions"
  | "draft"
  | "sent"
  | "awaiting_execution"
  | "awaiting_payment"
  | "completed"
  | "declined"

export interface IPipelineCard {
  reportId: string | null
  submissionId: string | null
  displayCode: string | null
  clientId: string | null
  clientName: string | null
  valueCents: number
  stageSince: string | null
}

export interface IPipelineReasonBreakdown {
  reason: DeclinedReason
  count: number
  totalCents: number
}

export interface IPipelineStage {
  key: PipelineStageKey
  count: number
  totalCents: number
  /** Quebra por motivo — presente só no estágio "declined". */
  reasons: IPipelineReasonBreakdown[] | null
  cards: IPipelineCard[]
}

export interface IPipelineConversion {
  sentCount: number
  /** Laudos aprovados pelo cliente no mês (não implica pagamento — ver Frente 6). */
  approvedCount: number
  conversionRate: number | null
  avgDaysSentToApproved: number | null
}

export interface IPipeline {
  stages: IPipelineStage[]
  conversion: IPipelineConversion
}

export const pipelineService = {
  /** Funil por estágio + conversão do mês corrente. */
  async get(token: string): Promise<IPipeline> {
    const { data } = await pipelineApi.get<IPipeline>("/pipeline", authHeader(token))
    return data
  },
}
