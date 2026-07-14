import { createApi } from "."

/**
 * Beacon da posição do provider (PLANO_ROTAS_TEMPO_REAL, Fase 2).
 *
 * **Sem `withPaywall` de propósito:** o interceptor global abre o modal de assinatura a cada 402, e
 * o beacon dispara a cada ~25s — uma assinatura vencida no meio da rota viraria um modal piscando
 * em loop. O hook trata o 402 desligando o beacon (silencioso); as telas de escrita da rota
 * (routeService) continuam com o paywall normal e são elas que avisam o provider.
 */
const api = createApi("/providers/me/location")

const authHeader = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

export interface ILocationPayload {
  lat: number
  lng: number
  accuracyM?: number
}

export interface ILocationResponse {
  lat: number | null
  lng: number | null
  accuracyM: number | null
  recordedAt: string | null
  /** Posição velha demais (> 5 min) para valer como "ao vivo" — ou inexistente. */
  stale: boolean
  /** Existe rota (route_run) iniciada hoje: é o contexto que dá sentido ao beacon. */
  onRoute: boolean
}

export const locationService = {
  /** Envia a última posição. Rate-limit do backend: 1 a cada 10s (429 é benigno). */
  async send(token: string, payload: ILocationPayload): Promise<ILocationResponse> {
    const { data } = await api.post("", payload, authHeader(token))
    return data
  },

  /** Última posição do PRÓPRIO provider (só o dono lê — a posição não é exposta na Fase 2). */
  async mine(token: string): Promise<ILocationResponse> {
    const { data } = await api.get("", authHeader(token))
    return data
  },
}
