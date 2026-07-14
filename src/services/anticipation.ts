import { createApi } from "."

/**
 * Antecipação de recebíveis (PLANO_ANTECIPACAO). Traz para o saldo, com taxa, o dinheiro do cartão
 * que só liberaria em D+30.
 *
 * NÃO confundir com SAQUE (`services/payout.ts`): o saque tira dinheiro do saldo e manda para o
 * banco do provider; a antecipação move de "a liberar" para o saldo, sem sair da conta. O limite
 * de antecipação não afeta o saque em nada.
 *
 * Duas coisas que a UI não pode esquecer:
 * 1. A antecipação NÃO é instantânea — passa por análise (até 2 dias úteis) e PODE SER NEGADA.
 *    Nunca prometa "dinheiro agora".
 * 2. `netCents` já vem líquido da comissão da Climabra (o gateway não desconta; o backend sim).
 *
 * Valores sempre em centavos.
 */
const anticipationApi = createApi("/providers/me")

const authHeader = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

export interface IAnticipationLimits {
  /** Provider ainda não conectou pagamentos. */
  hasGatewayAccount: boolean
  /**
   * Conta aprovada? Quando `false`, os valores vêm ZERADOS de propósito: o gateway entrega limite
   * cheio para conta em análise, mas recusa a antecipação — mostrar o número seria prometer um
   * botão que só dá erro.
   */
  anticipationEnabled: boolean
  totalCents: number
  availableCents: number
}

export interface IAnticipationSimulation {
  /** Valor da cobrança sobre o qual a antecipação incide. */
  grossCents: number
  /** Custo da antecipação — do gateway de pagamento, não da Climabra. */
  feeCents: number
  /** O que entra no saldo (já sem a comissão da Climabra). */
  netCents: number
  /** Dias de adiantamento comprados — é o que justifica a taxa na tela. */
  anticipationDays: number
  /** Gateway exige nota fiscal/contrato: no MVP a UI bloqueia e explica. */
  documentationRequired: boolean
}

/**
 * Estado de uma antecipação.
 *
 * ⚠️ `pending` = EM ANÁLISE no gateway (até 2 dias úteis), não "quase creditado" — e pode virar
 * `denied`. A UI nunca deve renderizar isso como sucesso.
 */
export type AnticipationStatus =
  | "pending" | "scheduled" | "credited" | "denied" | "cancelled" | "overdue"

export interface IAnticipation {
  id: string
  paymentId: string
  grossCents: number
  feeCents: number | null
  /** Já sem a comissão da Climabra. */
  netCents: number | null
  status: AnticipationStatus
  /** Por que foi negada — preenchido só quando `status === "denied"`. */
  denialReason: string | null
  requestedAt: string
  completedAt: string | null
}

export interface IAnticipationsPage {
  content: IAnticipation[]
  totalElements: number
  page: number
  totalPages: number
}

export interface IAutoAnticipation {
  /** Ligada no gateway (fonte da verdade — não há cópia local). */
  enabled: boolean
  /** Conta aprovada. Quando `false`, nem oferecemos o toggle. */
  anticipationEnabled: boolean
  /**
   * Vem junto de propósito: com limite ZERO, a automática para de antecipar EM SILÊNCIO. Sem este
   * número, a tela mostraria um switch verde que não faz nada.
   */
  availableCents: number
}

export const anticipationService = {
  /**
   * Quanto o provider pode antecipar hoje. Erro NÃO vira zero — a tela mostra retry (mesma regra
   * do card de saldo: um "R$ 0,00" fabricado faria o provider desistir de um dinheiro que ele tem).
   */
  async limits(token: string): Promise<IAnticipationLimits> {
    const { data } = await anticipationApi.get<IAnticipationLimits>(
      "/anticipation-limits", authHeader(token)
    )
    return data
  },

  /** Quanto custa antecipar uma cobrança. Não move nada — é o passo antes de confirmar. */
  async simulate(token: string, paymentId: string): Promise<IAnticipationSimulation> {
    const { data } = await anticipationApi.post<IAnticipationSimulation>(
      "/anticipations/simulate", { paymentId }, authHeader(token)
    )
    return data
  },

  /**
   * Solicita a antecipação. Sucesso aqui = "pedido enviado para análise", NÃO "dinheiro creditado".
   * A resposta vem com `status: "pending"` e o desfecho chega depois (webhook).
   */
  async request(token: string, paymentId: string): Promise<IAnticipation> {
    const { data } = await anticipationApi.post<IAnticipation>(
      "/anticipations", { paymentId }, authHeader(token)
    )
    return data
  },

  /** Histórico de antecipações (mais recentes primeiro). */
  async list(token: string, page = 0, size = 10): Promise<IAnticipationsPage> {
    const { data } = await anticipationApi.get<IAnticipationsPage>(
      "/anticipations", { ...authHeader(token), params: { page, size } }
    )
    return data
  },

  /** Estado da antecipação automática (com o limite junto — ver `IAutoAnticipation`). */
  async autoConfig(token: string): Promise<IAutoAnticipation> {
    const { data } = await anticipationApi.get<IAutoAnticipation>(
      "/anticipation-config", authHeader(token)
    )
    return data
  },

  /**
   * Liga/desliga a automática. A resposta traz o estado RELIDO do gateway — a tela usa esse, não um
   * optimistic update: um switch de dinheiro não pode mostrar "ligado" antes de estar ligado.
   */
  async setAutoConfig(token: string, enabled: boolean): Promise<IAutoAnticipation> {
    const { data } = await anticipationApi.put<IAutoAnticipation>(
      "/anticipation-config", { enabled }, authHeader(token)
    )
    return data
  },
}
