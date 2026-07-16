import { createApi } from "."

const whatsappApi = createApi("/whatsapp")

const authHeader = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

/** Estado do canal de WhatsApp do provider (Fase 1 do PLANO_MENSAGERIA_PROVIDER). */
export type WhatsappChannelStatus = "none" | "connecting" | "connected" | "disconnected"

/** Estado atual do canal — a UI faz poll disto até virar `connected`. */
export interface IWhatsappStatus {
  status: WhatsappChannelStatus
  /** O canal está habilitado neste ambiente? Desligado ⇒ a UI só avisa, não oferece conectar. */
  available: boolean
  /** Número vinculado (só dígitos) quando conectado — para exibir "Conectado como +55…". */
  connectedPhone: string | null
  /** Desde quando está conectado. */
  connectedSince: string | null
  /**
   * QR mais recente (data-URI base64) enquanto `connecting` — o QR rotaciona a cada ~40–60s e vem
   * pelo webhook; a UI troca a imagem quando muda. `null` nos demais estados ou se o QR expirou.
   */
  qrCode?: string | null
}

/** Retorno do POST /whatsapp/connect: o material para mostrar o QR. */
export interface IWhatsappConnect {
  status: WhatsappChannelStatus
  /** Imagem do QR em data-URI base64 (pronta para um `<img src>`). */
  qrCode: string | null
  /** Código de pareamento por telefone (alternativa ao QR), quando disponível. */
  pairingCode: string | null
}

/** Estado do sync de leads por marcador (Fase 2 do PLANO_CRM_WHATSAPP — Bloco A). */
export interface ILeadSyncConfig {
  /** O import de contatos → leads está ligado? */
  enabled: boolean
  /** Marcador salvo no nome do contato que "cura" o import (substring case-insensitive). */
  marker: string
  /** Quantos leads já vieram da agenda (`source=whatsapp_import`). */
  importedCount: number
  /**
   * Opt-in (D5): mensagem de número desconhecido cria lead `whatsapp_inbound`? Default desligado —
   * independente do import da agenda. Desligado: mensagens de desconhecidos não criam lead nem
   * ficam registradas.
   */
  inboundEnabled: boolean
}

/** Resultado do scan/Reprocessar. */
export interface ILeadScanResult {
  /** Leads novos criados neste scan. */
  imported: number
  /** Contatos que casaram o marcador (inclui os que já eram cliente/lead). */
  matched: number
  /** Total de leads importados depois do scan. */
  importedCount: number
}

export const whatsappService = {
  /** Estado atual do canal. */
  async status(token: string): Promise<IWhatsappStatus> {
    const { data } = await whatsappApi.get<IWhatsappStatus>("/status", authHeader(token))
    return data
  },

  /** Cria/recria a instância e devolve o QR para parear. */
  async connect(token: string): Promise<IWhatsappConnect> {
    const { data } = await whatsappApi.post<IWhatsappConnect>("/connect", {}, authHeader(token))
    return data
  },

  /** Desconecta e apaga a instância; canal volta a `none`. */
  async disconnect(token: string): Promise<IWhatsappStatus> {
    const { data } = await whatsappApi.delete<IWhatsappStatus>("", authHeader(token))
    return data
  },

  // ── Sync de leads por marcador (Fase 2 do PLANO_CRM_WHATSAPP — Bloco A) ──────

  /** Estado do sync (toggle + marcador + contador de importados). */
  async getLeadSync(token: string): Promise<ILeadSyncConfig> {
    const { data } = await whatsappApi.get<ILeadSyncConfig>("/lead-sync", authHeader(token))
    return data
  },

  /** Liga/desliga o sync, ajusta o marcador e o opt-in de lead por mensagem recebida (D5). */
  async updateLeadSync(
    token: string,
    payload: { enabled: boolean; marker?: string; inboundEnabled?: boolean },
  ): Promise<ILeadSyncConfig> {
    const { data } = await whatsappApi.put<ILeadSyncConfig>("/lead-sync", payload, authHeader(token))
    return data
  },

  /** Scan inicial/Reprocessar: importa os contatos da agenda com o marcador. */
  async scanLeadSync(token: string): Promise<ILeadScanResult> {
    const { data } = await whatsappApi.post<ILeadScanResult>("/lead-sync/scan", {}, authHeader(token))
    return data
  },
}

/** Formata um número só-dígitos (5511999990000) como +55 11 99999-0000 para exibição. */
export function formatConnectedPhone(digits: string | null): string {
  if (!digits) return ""
  const d = digits.replace(/\D/g, "")
  const withDdi = d.startsWith("55") ? d : `55${d}`
  const ddi = withDdi.slice(0, 2)
  const ddd = withDdi.slice(2, 4)
  const rest = withDdi.slice(4)
  if (rest.length < 8) return `+${withDdi}`
  const prefix = rest.slice(0, rest.length - 4)
  const suffix = rest.slice(-4)
  return `+${ddi} ${ddd} ${prefix}-${suffix}`
}
