import axios from "axios"
import { DEFAULT_URL } from "."

const api = axios.create({ baseURL: `${DEFAULT_URL}/availability` })

const authHeader = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

export interface AvailabilityDTO {
  id?: string
  dayOfWeek: number
  startTime: string
  endTime: string
  slotDurationMinutes: number
  isActive: boolean
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
}
