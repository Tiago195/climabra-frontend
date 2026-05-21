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

export interface IReportItemResponse {
  id: string
  description: string
  photoBefore: string | null
  photoAfter: string | null
  notes: string | null
  orderIndex: number
}

export interface IReportDetailResponse {
  report: IReportResponse
  items: IReportItemResponse[]
  equipment: { id: string; type: string; brand: string; model: string; label: string }
  client: { id: string; name: string; phone: string; email: string }
}

export interface IReportCreateRequest {
  equipmentId: string
  diagnosis?: string
  items: { description: string }[]
}

export interface IPublicReportItemResponse {
  description: string
  photoBefore: string | null
  photoAfter: string | null
  notes: string | null
}

export interface IPublicReportResponse {
  report: { status: string; diagnosis: string | null; finalNotes: string | null; completedAt: string | null }
  items: IPublicReportItemResponse[]
  equipment: { type: string; label: string; brand: string; model: string } | null
  client: { name: string }
  provider: { name: string; companyName: string | null; phone: string | null }
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

  async getDetail(token: string, id: string): Promise<IReportDetailResponse> {
    const { data } = await api.get(`/${id}`, authHeader(token))
    return data
  },

  async addItem(token: string, reportId: string, description: string): Promise<IReportDetailResponse> {
    const { data } = await api.post(`/${reportId}/items`, { description }, authHeader(token))
    return data
  },

  async deleteItem(token: string, reportId: string, itemId: string): Promise<IReportDetailResponse> {
    const { data } = await api.delete(`/${reportId}/items/${itemId}`, authHeader(token))
    return data
  },

  async updateItem(
    token: string,
    reportId: string,
    itemId: string,
    body: { photoBefore?: string; photoAfter?: string; notes?: string }
  ): Promise<IReportDetailResponse> {
    const { data } = await api.patch(`/${reportId}/items/${itemId}`, body, authHeader(token))
    return data
  },

  async send(token: string, reportId: string): Promise<IReportDetailResponse> {
    const { data } = await api.put(`/${reportId}/send`, {}, authHeader(token))
    return data
  },

  async complete(token: string, reportId: string): Promise<IReportDetailResponse> {
    const { data } = await api.put(`/${reportId}/complete`, {}, authHeader(token))
    return data
  },

  async getPublic(providerToken: string, clientId: string, equipmentId: string, reportToken: string): Promise<IPublicReportResponse> {
    const { data } = await api.get(`/public/${providerToken}/${clientId}/${equipmentId}/${reportToken}`)
    return data
  },

  async approve(providerToken: string, clientId: string, equipmentId: string, reportToken: string): Promise<IPublicReportResponse> {
    const { data } = await api.put(`/public/${providerToken}/${clientId}/${equipmentId}/${reportToken}/approve`, {})
    return data
  },
}
