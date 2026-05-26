import axios from "axios"
import { DEFAULT_URL } from "."
import type { Shift } from "./enums"

const api = axios.create({ baseURL: `${DEFAULT_URL}/availability` })
const publicApi = axios.create({ baseURL: `${DEFAULT_URL}/providers` })

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
}
