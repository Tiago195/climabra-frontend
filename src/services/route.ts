import { createApi } from "."
import type { Shift } from "./enums"

/**
 * Rota do dia com estado (PLANO_ROTAS_TEMPO_REAL, Fase 1). O GET é leitura; reordenar/iniciar/
 * re-otimizar/avisar são writes (paywall). A ordem servida aqui é a fonte única para as telas.
 */
const api = createApi("/providers/me/route", { withPaywall: true })

const authHeader = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

export interface IRouteStop {
  appointmentId: string
  clientId: string
  clientName: string
  shift: string | null
  lat: number
  lng: number
  /** Minutos acumulados desde a base até chegar nesta parada. */
  cumulativeMin: number
}

export type RunStatus = "draft" | "started" | "completed"

/** Estado da rota de um turno + ordem vigente das visitas (com coords) do turno. */
export interface IRouteSection {
  shift: Shift
  status: RunStatus
  startedAt: string | null
  appointmentIds: string[]
}

export interface IRoutePlanResponse {
  date: string
  origin: { lat: number | null; lng: number | null }
  orderedStops: IRouteStop[]
  legDurationMin: number[]
  legDistanceKm: number[]
  totalMin: number
  totalKm: number
  /** Polyline da rota real (cada ponto [lat, lng]); vazia no fallback. */
  geometry: [number, number][]
  /** true = OSRM (rota real); false = fallback Haversine (estimativa). */
  optimized: boolean
  roundTrip: boolean
  /** Seções por turno (status + ordem) — para o controle da rota. */
  sections: IRouteSection[]
}

export type OnMyWayStatus = "sent" | "failed" | "skipped"

export const routeService = {
  /** Rota do dia (ordem do run + status por turno). `date` = "YYYY-MM-DD". */
  async get(token: string, date: string): Promise<IRoutePlanResponse> {
    const { data } = await api.get("", { params: { date }, ...authHeader(token) })
    return data
  },

  /** Reordena as paradas de um turno (drag & drop). Só em draft. */
  async reorder(token: string, date: string, shift: Shift, appointmentIds: string[]): Promise<IRoutePlanResponse> {
    const { data } = await api.patch(`/${date}/${shift}/order`, { appointmentIds }, authHeader(token))
    return data
  },

  /** Re-otimiza o turno em draft, sobrescrevendo a ordem manual. */
  async optimize(token: string, date: string, shift: Shift): Promise<IRoutePlanResponse> {
    const { data } = await api.post(`/${date}/${shift}/optimize`, {}, authHeader(token))
    return data
  },

  /** Inicia a rota do turno (congela a ordem, avisa o 1º cliente). Idempotente. */
  async start(token: string, date: string, shift: Shift): Promise<IRoutePlanResponse> {
    const { data } = await api.post(`/${date}/${shift}/start`, {}, authHeader(token))
    return data
  },

  /** "Estou indo": avisa manualmente um cliente da rota já iniciada. */
  async notify(token: string, date: string, shift: Shift, appointmentId: string): Promise<{ status: OnMyWayStatus }> {
    const { data } = await api.post(`/${date}/${shift}/notify/${appointmentId}`, {}, authHeader(token))
    return data
  },
}
