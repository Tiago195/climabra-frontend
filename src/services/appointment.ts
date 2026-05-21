import axios from "axios"
import { DEFAULT_URL } from "."

const api = axios.create({ baseURL: `${DEFAULT_URL}/appointments` })

const authHeader = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

export interface IAppointmentInfo {
  id: string
  scheduledAt: string
  status: string
  equipmentId: string | null
  submissionId: string | null
  notes: string | null
}

export interface IAppointmentClientInfo {
  id: string
  name: string
  phone: string
  email: string
}

export interface IAppointmentEquipmentInfo {
  id: string
  type: string
  brand: string
  model: string
  label: string
}

export interface IAppointmentSubmissionInfo {
  id: string
  description: string
  photoUrls: string[]
  problemType: string | null
}

export interface IAppointmentReportInfo {
  id: string
  status: "draft" | "sent" | "approved" | "completed"
}

export interface IAppointmentDetailResponse {
  appointment: IAppointmentInfo
  client: IAppointmentClientInfo
  equipment: IAppointmentEquipmentInfo | null
  submission: IAppointmentSubmissionInfo | null
  report: IAppointmentReportInfo | null
}

export interface ICreateAppointmentRequest {
  clientId: string
  equipmentId?: string
  scheduledAt: string
  notes?: string
}

export const appointmentService = {
  async list(token: string): Promise<IAppointmentDetailResponse[]> {
    const { data } = await api.get("", authHeader(token))
    return data
  },

  async create(token: string, payload: ICreateAppointmentRequest): Promise<IAppointmentDetailResponse> {
    const { data } = await api.post("", payload, authHeader(token))
    return data
  },

  async complete(token: string, id: string): Promise<void> {
    await api.put(`/${id}/complete`, {}, authHeader(token))
  },

  async cancel(token: string, id: string): Promise<void> {
    await api.put(`/${id}/cancel`, {}, authHeader(token))
  },
}
