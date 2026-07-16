import { createApi } from "."
import type { IClientNotesPage } from "./clientNote"

const api = createApi("/leads", { withPaywall: true })

const authHeader = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

/** Origem de um lead (Fase 1 CRM: só `manual`; `whatsapp_*` chegam nas F2/F3). */
export type LeadSource = "whatsapp_import" | "whatsapp_inbound" | "manual"

/** Status do lead no funil de entrada. */
export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "discarded"

export interface ILeadResponse {
  id: string
  providerId: string
  name: string | null
  phone: string
  source: LeadSource
  status: LeadStatus
  waContactId: string | null
  lastMessageAt: string | null
  clientId: string | null
  createdAt: string
  updatedAt: string | null
}

export interface ILeadCreateRequest {
  name: string
  phone: string
}

export interface ILeadUpdateRequest {
  name?: string
  status?: LeadStatus
}

/** Payload da conversão Lead → Client: só o que falta (nome/telefone vêm do lead). */
export interface ILeadConvertRequest {
  email: string
  cep: string
  street: string
  streetNumber: number
  complement?: string
  neighborhood: string
  city: string
  state: string
}

export const leadService = {
  async list(token: string, opts?: { status?: LeadStatus; q?: string }): Promise<ILeadResponse[]> {
    const params: Record<string, string> = {}
    if (opts?.status) params.status = opts.status
    if (opts?.q) params.q = opts.q
    const { data } = await api.get("", { ...authHeader(token), params })
    return data
  },

  async create(token: string, payload: ILeadCreateRequest): Promise<ILeadResponse> {
    const { data } = await api.post("", payload, authHeader(token))
    return data
  },

  async update(token: string, id: string, payload: ILeadUpdateRequest): Promise<ILeadResponse> {
    const { data } = await api.patch(`/${id}`, payload, authHeader(token))
    return data
  },

  async remove(token: string, id: string): Promise<void> {
    await api.delete(`/${id}`, authHeader(token))
  },

  /** Converte o lead em cliente completo; devolve o lead atualizado (status=converted, clientId). */
  async convert(token: string, id: string, payload: ILeadConvertRequest): Promise<ILeadResponse> {
    const { data } = await api.post(`/${id}/convert`, payload, authHeader(token))
    return data
  },

  /**
   * Timeline do lead (Bloco B — F3): mensagens recebidas (`whatsapp_in`) e demais notas do lead,
   * mais recentes primeiro. Só leitura no v1 (as inbound entram pelo webhook, não pela UI).
   */
  async notes(token: string, id: string, page = 0, size = 50): Promise<IClientNotesPage> {
    const { data } = await api.get<IClientNotesPage>(
      `/${id}/notes`, { ...authHeader(token), params: { page, size } }
    )
    return data
  },
}
