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

export const availabilityService = {
  async list(token: string): Promise<AvailabilityDTO[]> {
    const { data } = await api.get("", authHeader(token))
    return data
  },

  async upsert(token: string, payload: AvailabilityDTO): Promise<AvailabilityDTO> {
    const { data } = await api.post("", payload, authHeader(token))
    return data
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
