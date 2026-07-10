import { createApi } from "."
import type { NextActionType, NextActionUrgency } from "./enums"

/**
 * Dashboard "Próximas Ações" do provider (CRM F4). Agregado computado
 * on-demand — solicitações sem laudo, laudos aguardando o cliente, lembretes
 * de nota vencidos e visitas de hoje. Somente leitura.
 */
const nextActionsApi = createApi("/providers/me")

const authHeader = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

export interface INextAction {
  type: NextActionType
  urgency: NextActionUrgency
  title: string | null
  description: string | null
  baseAt: string | null
  clientId: string | null
  clientName: string | null
  reportId: string | null
  displayCode: string | null
  valueCents: number | null
  submissionId: string | null
  appointmentId: string | null
  noteId: string | null
}

export interface INextActions {
  actions: INextAction[]
}

export const nextActionsService = {
  /** Itens acionáveis do provider, já ordenados por urgência + data-base. */
  async get(token: string): Promise<INextActions> {
    const { data } = await nextActionsApi.get<INextActions>("/next-actions", authHeader(token))
    return data
  },
}
