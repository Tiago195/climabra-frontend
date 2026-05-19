import axios from "axios"
import { DEFAULT_URL } from "."

const api = axios.create({ baseURL: `${DEFAULT_URL}/reports` })

const authHeader = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

export interface IReportResponse {
  id: string
  equipmentId: string
  providerId: string
  clientId: string
  publicToken: string
  status: "draft" | "sent" | "approved" | "completed"
  title?: string
  diagnosis?: string
  finalNotes?: string
  createdAt: string
  sentAt?: string
  approvedAt?: string
  completedAt?: string
}

export interface IReportCreateRequest {
  equipmentId: string
  diagnosis?: string
  items: { description: string }[]
}

export const reportService = {
  async listByEquipment(token: string, equipmentId: string): Promise<IReportResponse[]> {
    const { data } = await api.get(`/equipment/${equipmentId}`, authHeader(token))
    return data
  },

  async create(token: string, payload: IReportCreateRequest): Promise<IReportResponse> {
    const { data } = await api.post("", payload, authHeader(token))
    return data
  },
}
