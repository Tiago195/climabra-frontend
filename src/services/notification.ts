import { createApi } from "."
import type { NotificationType } from "./enums"

/**
 * Serviço do subsistema de comunicação (CRM F3 — PLANO_CRM_PROFISSIONAL.md, Frente 3).
 * Templates + preferências no Settings do provider e envio manual de WhatsApp ao cliente.
 * Sempre autenticado como provider; o backend valida ownership.
 */
const api = createApi("/notifications")

const authHeader = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

export interface IMessageTemplate {
  type: NotificationType
  body: string
  defaultBody: string
  custom: boolean
}

export interface INotificationPref {
  type: NotificationType
  enabled: boolean
}

export type ManualSendStatus = "sent" | "failed" | "skipped"

export const notificationService = {
  async listTemplates(token: string): Promise<IMessageTemplate[]> {
    const { data } = await api.get<IMessageTemplate[]>("/templates", authHeader(token))
    return data
  },

  async saveTemplate(token: string, type: NotificationType, body: string): Promise<IMessageTemplate> {
    const { data } = await api.put<IMessageTemplate>(`/templates/${type}`, { body }, authHeader(token))
    return data
  },

  async resetTemplate(token: string, type: NotificationType): Promise<IMessageTemplate> {
    const { data } = await api.delete<IMessageTemplate>(`/templates/${type}`, authHeader(token))
    return data
  },

  async listPrefs(token: string): Promise<INotificationPref[]> {
    const { data } = await api.get<INotificationPref[]>("/prefs", authHeader(token))
    return data
  },

  async setPref(token: string, type: NotificationType, enabled: boolean): Promise<INotificationPref> {
    const { data } = await api.put<INotificationPref>(`/prefs/${type}`, { enabled }, authHeader(token))
    return data
  },

  async sendWhatsapp(token: string, clientId: string, body: string): Promise<{ status: ManualSendStatus }> {
    const { data } = await api.post<{ status: ManualSendStatus }>("/whatsapp", { clientId, body }, authHeader(token))
    return data
  },
}
