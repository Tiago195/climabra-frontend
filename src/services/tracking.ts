import { createApi } from "."

/**
 * Página pública de acompanhamento "a caminho" (PLANO_ROTAS_TEMPO_REAL, Fase 3). Endpoint PÚBLICO
 * — o gate é o próprio token de vida curta (sem auth, sem paywall). O DTO é enxuto de propósito:
 * zero dado de terceiro.
 */
const api = createApi("/track")

/** Estados do acompanhamento (espelham o backend). */
export type TrackingStatus = "on_my_way" | "arrived" | "expired"

export interface ITrackingResponse {
  providerName: string
  /** Posição AO VIVO do prestador; null = beacon morto/stale (página cai em "posição indisponível"). */
  providerLat: number | null
  providerLng: number | null
  /** Endereço do próprio cliente destino (marcador fixo do mapa). */
  clientLat: number | null
  clientLng: number | null
  /** Minutos estimados até chegar; null sem posição ao vivo ou fora do estado "a caminho". */
  etaMin: number | null
  status: TrackingStatus
}

export const trackingService = {
  /** Estado atual do acompanhamento. 404 = link inválido/expirado (tratar como "expired" na UI). */
  async get(token: string): Promise<ITrackingResponse> {
    const { data } = await api.get(`/${token}`)
    return data
  },
}
