import axios from "axios"
import { DEFAULT_URL } from "."

const api = axios.create({ baseURL: `${DEFAULT_URL}/availability` })
const publicApi = axios.create({ baseURL: `${DEFAULT_URL}/providers` })

const authHeader = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

export interface AvailabilityDTO {
  id?: string
  dayOfWeek: number
  startTime: string
  endTime: string
  slotDurationMinutes: number
  isActive: boolean
}

export interface ISignUpProviderResponse {
  provider: {
    name: string
    companyName: string | null
  }
  activeDaysOfWeek: number[]
}

export interface ISignUpSlotsResponse {
  slots: string[]
}

export interface IExceptionResponse {
  id: string
  startDate: string          // ISO date YYYY-MM-DD
  endDate: string
  startTime: string | null   // HH:mm ou null = dia inteiro
  endTime: string | null
  reason: string | null
}

export interface IExceptionPayload {
  startDate: string
  endDate: string
  startTime?: string         // se omitidos → dia inteiro
  endTime?: string
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
