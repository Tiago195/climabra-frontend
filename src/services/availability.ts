import { createApi } from "."
import type { Shift } from "./enums"

const api = createApi("/availability", { withPaywall: true })
const publicApi = createApi("/providers")

const authHeader = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

/** Configuração de UM turno em UM dia da semana. Cada provider tem até 7×3 = 21 registros. */
export interface AvailabilityDTO {
  id?: string
  dayOfWeek: number          // 0=Domingo … 6=Sábado
  shift: Shift               // "morning" | "afternoon" | "night"
  startTime: string          // "HH:mm" ou "HH:mm:ss"
  endTime: string
  capacity: number           // 1–50 — vagas por turno
  isActive: boolean
}

export interface ISignUpProviderResponse {
  provider: {
    name: string
    companyName: string | null
  }
  activeDaysOfWeek: number[]
}

/** Estado de UM turno em UMA data específica vista pelo cliente. */
export interface IShiftSlot {
  shift: Shift
  startTime: string
  endTime: string
  capacity: number
  available: number          // capacity - agendados confirmados
  blocked: boolean           // bloqueado por exceção
}

export interface ISignUpSlotsResponse {
  shifts: IShiftSlot[]
}

export interface IExceptionResponse {
  id: string
  startDate: string          // ISO date YYYY-MM-DD
  endDate: string
  shifts: Shift[]            // [] = dia inteiro bloqueado em todas as datas do range
  reason: string | null
}

export interface IExceptionPayload {
  startDate: string
  endDate: string
  shifts?: Shift[]           // undefined/[] = dia inteiro
  reason?: string
}

export const availabilityService = {
  async list(token: string): Promise<AvailabilityDTO[]> {
    const { data } = await api.get("", authHeader(token))
    return data
  },

  async upsert(token: string, payload: AvailabilityDTO): Promise<AvailabilityDTO> {
    const { data } = await api.post("", payload, authHeader(token))
    return data
  },

  async listExceptions(token: string): Promise<IExceptionResponse[]> {
    const { data } = await api.get("/exceptions", authHeader(token))
    return data
  },

  async createException(token: string, payload: IExceptionPayload): Promise<IExceptionResponse> {
    const { data } = await api.post("/exceptions", payload, authHeader(token))
    return data
  },

  async deleteException(token: string, id: string): Promise<void> {
    await api.delete(`/exceptions/${id}`, authHeader(token))
  },

  async getSignUpProvider(publicToken: string): Promise<ISignUpProviderResponse> {
    const { data } = await publicApi.get(`/${publicToken}/availability`)
    return data
  },

  async getSignUpSlots(publicToken: string, date: string): Promise<ISignUpSlotsResponse> {
    const { data } = await publicApi.get(`/${publicToken}/availability/slots`, { params: { date } })
    return data
  },

  /**
   * Recomendação privacy-safe de proximidade por turno (Fase 6). Devolve só `{shift, nearbyScore}`
   * por turno ativo do dia — sem coords/endereço de terceiros. `nearbyScore > 0` = região atendida.
   */
  async getSlotProximity(
    publicToken: string, date: string, who: { cep?: string; clientId?: string },
  ): Promise<ISlotProximityResponse> {
    const { data } = await publicApi.get(`/${publicToken}/availability/proximity`, {
      params: { date, ...who },
    })
    return data
  },

  /**
   * Dias recomendados por proximidade num intervalo (mês), Fase 6 — destaca o calendário antes do
   * clique. `from`/`to` = "YYYY-MM-DD". Só dias com `nearbyScore > 0` voltam. Privacy-safe.
   */
  async getProximityDays(
    publicToken: string, from: string, to: string, who: { cep?: string; clientId?: string },
  ): Promise<IProximityDaysResponse> {
    const { data } = await publicApi.get(`/${publicToken}/availability/proximity-days`, {
      params: { from, to, ...who },
    })
    return data
  },

  /** Resumo de vagas por dia num intervalo (mês) — p/ sinalizar lotado/poucas vagas no calendário. */
  async getDayStatus(
    publicToken: string, from: string, to: string,
  ): Promise<IDayAvailabilityResponse> {
    const { data } = await publicApi.get(`/${publicToken}/availability/day-status`, {
      params: { from, to },
    })
    return data
  },
}

export interface ISlotProximityResponse {
  shifts: { shift: Shift; nearbyScore: number; level: "recommended" | "discouraged" | "neutral" }[]
}

export interface IProximityDaysResponse {
  /**
   * Dias com sinal de proximidade (omite neutros); `date` = "YYYY-MM-DD".
   * `level`: "recommended" (provider já atende a região) | "discouraged" (visitas só muito longe).
   */
  days: { date: string; nearbyScore: number; level: "recommended" | "discouraged" }[]
}

export interface IDayAvailabilityResponse {
  /** Um item por dia com turno ativo no intervalo; `date` = "YYYY-MM-DD". */
  days: { date: string; capacity: number; available: number }[]
}
