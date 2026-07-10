import { createApi } from "."
import type { AppointmentStatus, EquipmentType, ReportStatus, Shift, VisitType } from "./enums"

const api = createApi("/appointments", { withPaywall: true })

const authHeader = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

export interface IAppointmentInfo {
  id: string
  scheduledDate: string      // "YYYY-MM-DD"
  shift: Shift               // "morning" | "afternoon" | "night"
  status: AppointmentStatus
  visitType: VisitType       // "standard" | "assessment" | "execution"
  equipmentIds: string[]
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
  type: EquipmentType
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
  equipmentId: string
  status: ReportStatus
  serviceStartedAt: string | null   // != null = serviço em execução ("Em curso")
  role: "assessment" | "execution" | null   // papel do vínculo laudo↔visita
}

/**
 * Espelha `AppointmentFacade.isVisitDeliverableForReport` (backend): um laudo é
 * "entregável" para a visita quando está `completed`, ou quando é a AVALIAÇÃO de
 * um laudo que já chegou a `awaiting_execution` (orçamento aprovado; a execução
 * virá em outra visita). Ver ROADMAP_MULTIPLAS_VISITAS.md.
 */
export function isReportDeliverableForVisit(r: IAppointmentReportInfo): boolean {
  return r.status === "completed" || (r.role === "assessment" && r.status === "awaiting_execution")
}

export interface IAppointmentDetailResponse {
  appointment: IAppointmentInfo
  client: IAppointmentClientInfo
  equipments: IAppointmentEquipmentInfo[]
  submission: IAppointmentSubmissionInfo | null
  reports: IAppointmentReportInfo[]
}

export interface ICreateAppointmentRequest {
  clientId: string
  equipmentIds?: string[]
  scheduledDate: string      // "YYYY-MM-DD"
  shift: Shift
  notes?: string
  visitType?: VisitType      // "standard" (default) | "assessment" | "execution"
  reportId?: string          // vincula a um laudo existente (visita de execução) — F2
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

  /** Move a visita para outro turno da rota do dia (valida capacidade do destino no backend). */
  async moveShift(token: string, id: string, shift: string): Promise<IAppointmentDetailResponse> {
    const { data } = await api.patch(`/${id}/shift`, { shift }, authHeader(token))
    return data
  },
}
