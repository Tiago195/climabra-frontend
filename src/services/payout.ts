import { createApi } from "."

const payoutApi = createApi("/providers/me/payout-account")
const payoutsApi = createApi("/providers/me/payouts")

const authHeader = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

/** Tipo da chave PIX de destino do saque. `evp` = chave aleatória. */
export type PixKeyType = "cpf_cnpj" | "email" | "phone" | "evp"

/** Destino do saque. A chave volta SEMPRE mascarada — nunca inteira. */
export interface IPayoutAccount {
  hasAccount: boolean
  pixKeyType: PixKeyType | null
  maskedKey: string | null
  ownerName: string | null
  confirmedAt: string | null
  /** Fim do bloqueio de 24h após cadastrar/trocar o destino (anti-fraude). */
  payoutBlockedUntil: string | null
  /** Saque automático ligado? (F6) */
  autoPayoutEnabled: boolean
  /** Só saca sozinho quando o saldo atingir este piso. */
  autoPayoutMinCents: number
}

export interface IPayoutAccountOtp {
  phoneMasked: string
  resendInSeconds: number
}

export interface ISavePayoutAccount {
  pixKeyType: PixKeyType
  pixKey: string
  /** Código de 6 dígitos recebido no WhatsApp. Sem ele nada é gravado. */
  code: string
}

/** Valor mínimo de saque — espelha `PayoutService.MIN_PAYOUT_CENTS` no backend (R$ 10,00). */
export const MIN_PAYOUT_CENTS = 1000

export type PayoutStatus = "requested" | "processing" | "done" | "failed" | "canceled"

/** Um saque. `destination` é a chave mascarada NO MOMENTO do saque (não muda se a chave trocar). */
export interface IPayout {
  id: string
  amountCents: number
  feeCents: number | null
  netCents: number | null
  status: PayoutStatus
  destination: string | null
  failureReason: string | null
  requestedAt: string
  completedAt: string | null
}

export interface IPayoutsPage {
  content: IPayout[]
  totalElements: number
  page: number
  totalPages: number
}

export const payoutService = {
  /** Destino de saque vigente (chave mascarada). */
  async getAccount(token: string): Promise<IPayoutAccount> {
    const { data } = await payoutApi.get<IPayoutAccount>("", authHeader(token))
    return data
  },

  /** Dispara o código no WhatsApp — obrigatório antes de cadastrar/trocar o destino. */
  async requestOtp(token: string): Promise<IPayoutAccountOtp> {
    const { data } = await payoutApi.post<IPayoutAccountOtp>("/otp", {}, authHeader(token))
    return data
  },

  /** Cadastra/troca o destino (exige o código do WhatsApp). */
  async saveAccount(token: string, body: ISavePayoutAccount): Promise<IPayoutAccount> {
    const { data } = await payoutApi.post<IPayoutAccount>("", body, authHeader(token))
    return data
  },

  // ── F3: o saque ────────────────────────────────────────────────────────────

  /** Histórico de saques (mais recentes primeiro). */
  async list(token: string, page = 0, size = 20): Promise<IPayoutsPage> {
    const { data } = await payoutsApi.get<IPayoutsPage>(
      "", { ...authHeader(token), params: { page, size } }
    )
    return data
  },

  /** Dispara o código do WhatsApp para confirmar o saque (todo saque exige OTP). */
  async requestPayoutOtp(token: string): Promise<IPayoutAccountOtp> {
    const { data } = await payoutsApi.post<IPayoutAccountOtp>("/otp", {}, authHeader(token))
    return data
  },

  /** Executa o saque para a chave PIX cadastrada. */
  async requestPayout(token: string, amountCents: number, code: string): Promise<IPayout> {
    const { data } = await payoutsApi.post<IPayout>("", { amountCents, code }, authHeader(token))
    return data
  },

  /** Liga/desliga o saque automático (F6). */
  async updateAutoPayout(token: string, enabled: boolean, minCents?: number): Promise<IPayoutAccount> {
    const { data } = await payoutApi.put<IPayoutAccount>(
      "/auto", { enabled, minCents }, authHeader(token)
    )
    return data
  },
}
