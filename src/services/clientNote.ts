import { createApi } from "."
import type { NoteKind } from "./enums"

/**
 * Serviço das anotações/interações de cliente (CRM F1 — PLANO_CRM_PROFISSIONAL.md,
 * Frente 1). CRUD simples sob `/clients/{clientId}/notes`, sempre autenticado
 * como provider — o backend valida que o cliente pertence a quem chama.
 */
const api = createApi("/clients")

const authHeader = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

export interface IClientNote {
  id: string
  clientId: string
  providerId: string
  content: string
  kind: NoteKind
  remindAt: string | null
  createdAt: string
  updatedAt: string
}

export interface IClientNotesPage {
  items: IClientNote[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface IClientNoteCreate {
  content: string
  kind: NoteKind
  remindAt?: string | null
}

export interface IClientNoteUpdate {
  content?: string
  kind?: NoteKind
  remindAt?: string | null
  /** true = remove o lembrete (overlay não distingue "não informado" de null). */
  clearRemindAt?: boolean
}

export const clientNoteService = {
  async list(token: string, clientId: string, page = 0, size = 20): Promise<IClientNotesPage> {
    const { data } = await api.get<IClientNotesPage>(
      `/${clientId}/notes`, { ...authHeader(token), params: { page, size } }
    )
    return data
  },

  async create(token: string, clientId: string, payload: IClientNoteCreate): Promise<IClientNote> {
    const { data } = await api.post<IClientNote>(`/${clientId}/notes`, payload, authHeader(token))
    return data
  },

  async update(token: string, clientId: string, noteId: string, payload: IClientNoteUpdate): Promise<IClientNote> {
    const { data } = await api.patch<IClientNote>(`/${clientId}/notes/${noteId}`, payload, authHeader(token))
    return data
  },

  async remove(token: string, clientId: string, noteId: string): Promise<void> {
    await api.delete(`/${clientId}/notes/${noteId}`, authHeader(token))
  },
}
