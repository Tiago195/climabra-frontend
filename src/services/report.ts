import axios from "axios"
import { DEFAULT_URL } from "."
import type { EquipmentType, ReportStatus } from "./enums"

const api = axios.create({ baseURL: `${DEFAULT_URL}/reports` })

const authHeader = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

// ─── Métodos de pagamento (espelham Payment.PaymentMethod do backend) ────────
export type PaymentMethod = "pix" | "credit" | "debit" | "cash" | "boleto"

// ─── Reports autenticados (provider) ─────────────────────────────────────────

export interface IReportResponse {
  id: string
  equipmentId: string
  providerId: string
  clientId: string
  publicToken: string
  displayCode?: string | null
  status: ReportStatus
  title?: string
  diagnosis?: string
  finalNotes?: string
  createdAt: string
  sentAt?: string
  approvedAt?: string
  serviceStartedAt?: string
  completedAt?: string
}

export interface IReportItemResponse {
  id: string
  description: string
  photoBefore: string | null
  photoAfter: string | null
  notes: string | null
  orderIndex: number
  rejected: boolean
  quantity: number | null
  unitPriceCents: number | null
  warrantyDays: number | null
  photoBeforeUploadedAt: string | null
  photoBeforeUploadedByName: string | null
  photoAfterUploadedAt: string | null
  photoAfterUploadedByName: string | null
}

export interface IPaymentInfo {
  method: PaymentMethod
  detail: string | null
  amountCents: number
  paidAt: string
}

export interface IFinancialInfo {
  subtotalCents: number | null
  discountCents: number | null
  totalCents: number | null
  payment: IPaymentInfo | null
}

export interface IRatingInfo {
  stars: number
  comment: string | null
  ratedByName: string | null
  ratedAt: string
}

export interface IReportDetailResponse {
  report: {
    id: string
    publicToken: string
    displayCode: string | null
    status: ReportStatus
    title: string | null
    diagnosis: string | null
    finalNotes: string | null
    submittedAt: string | null
    createdAt: string | null
    sentAt: string | null
    approvedAt: string | null
    serviceStartedAt: string | null
    photoBeforeAt: string | null
    photoAfterAt: string | null
    completedAt: string | null
  }
  items: IReportItemResponse[]
  equipment: { id: string; type: EquipmentType; brand: string; model: string; label: string }
  client: { id: string; name: string; phone: string; email: string }
  financial: IFinancialInfo | null
  rating: IRatingInfo | null
}

export interface IReportCreateRequest {
  equipmentId: string
  appointmentId?: string
  diagnosis?: string
  items: IReportItemRequest[]
}

export interface IReportItemRequest {
  description: string
  quantity?: number
  unitPriceCents?: number
  warrantyDays?: number
}

export interface IRegisterPaymentRequest {
  method: PaymentMethod
  detail?: string
  amountCents: number
  paidAt: string
}

// ─── Reports públicos (cliente final via cadeia de tokens) ───────────────────

export interface IPublicReportItemResponse {
  id: string
  description: string
  photoBefore: string | null
  photoAfter: string | null
  notes: string | null
  rejected: boolean
  quantity: number | null
  unitPriceCents: number | null
  warrantyDays: number | null
  photoBeforeUploadedAt: string | null
  photoBeforeUploadedByName: string | null
  photoAfterUploadedAt: string | null
  photoAfterUploadedByName: string | null
}

export interface IPublicReportResponse {
  report: {
    displayCode: string | null
    status: ReportStatus
    diagnosis: string | null
    finalNotes: string | null
    submittedAt: string | null
    sentAt: string | null
    approvedAt: string | null
    serviceStartedAt: string | null
    photoBeforeAt: string | null
    photoAfterAt: string | null
    completedAt: string | null
  }
  items: IPublicReportItemResponse[]
  equipment: { type: EquipmentType; label: string; brand: string; model: string } | null
  client: { name: string }
  provider: { name: string; companyName: string | null; phone: string | null }
  financial: IFinancialInfo | null
  rating: IRatingInfo | null
}

export interface ISubmitRatingRequest {
  stars: number
  comment?: string
}

export interface ISubmitRatingResponse {
  id: string
  stars: number
  comment: string | null
  ratedByName: string | null
  ratedAt: string
}

// ─── Service ─────────────────────────────────────────────────────────────────

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

  async updateReport(
    token: string,
    reportId: string,
    body: { title?: string; diagnosis?: string; finalNotes?: string }
  ): Promise<IReportDetailResponse> {
    const { data } = await api.patch(`/${reportId}`, body, authHeader(token))
    return data
  },

  async addItem(token: string, reportId: string, item: IReportItemRequest): Promise<IReportDetailResponse> {
    const { data } = await api.post(`/${reportId}/items`, item, authHeader(token))
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
    body: {
      description?: string
      photoBefore?: string
      photoAfter?: string
      notes?: string
      quantity?: number
      unitPriceCents?: number
      warrantyDays?: number
    }
  ): Promise<IReportDetailResponse> {
    const { data } = await api.patch(`/${reportId}/items/${itemId}`, body, authHeader(token))
    return data
  },

  async send(token: string, reportId: string): Promise<IReportDetailResponse> {
    const { data } = await api.put(`/${reportId}/send`, {}, authHeader(token))
    return data
  },

  async startService(token: string, reportId: string): Promise<IReportDetailResponse> {
    const { data } = await api.put(`/${reportId}/start-service`, {}, authHeader(token))
    return data
  },

  async complete(token: string, reportId: string): Promise<IReportDetailResponse> {
    const { data } = await api.put(`/${reportId}/complete`, {}, authHeader(token))
    return data
  },

  async registerPayment(token: string, reportId: string, payload: IRegisterPaymentRequest) {
    const { data } = await api.post(`/${reportId}/payment`, payload, authHeader(token))
    return data
  },

  // ─── Endpoints públicos (cliente) ──────────────────────────────────────────

  async getPublic(providerToken: string, clientId: string, equipmentId: string, reportToken: string): Promise<IPublicReportResponse> {
    const { data } = await api.get(`/public/${providerToken}/${clientId}/${equipmentId}/${reportToken}`)
    return data
  },

  async approve(providerToken: string, clientId: string, equipmentId: string, reportToken: string, approvedItemIds: string[]): Promise<IPublicReportResponse> {
    const { data } = await api.put(`/public/${providerToken}/${clientId}/${equipmentId}/${reportToken}/approve`, { approvedItemIds })
    return data
  },

  async submitRating(
    providerToken: string, clientId: string, equipmentId: string, reportToken: string,
    payload: ISubmitRatingRequest
  ): Promise<ISubmitRatingResponse> {
    const { data } = await api.post(
      `/public/${providerToken}/${clientId}/${equipmentId}/${reportToken}/rating`,
      payload
    )
    return data
  },

  /** URL absoluta do PDF do laudo. Use direto em window.open ou anchor download. */
  publicPdfUrl(providerToken: string, clientId: string, equipmentId: string, reportToken: string): string {
    return `${DEFAULT_URL}/reports/public/${providerToken}/${clientId}/${equipmentId}/${reportToken}/pdf`
  },
}
